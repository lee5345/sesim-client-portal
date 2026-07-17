"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";

import { DailyWorkerFormDialog } from "@/components/client/daily-worker-form-dialog";
import { ExcelExportDialog } from "@/components/export/excel-export-dialog";
import { DailyWorkersTableView } from "@/components/daily-workers/daily-workers-table-view";
import { DailyWorkersMonthSelector } from "@/components/daily-workers/daily-workers-month-selector";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  EMPTY_DAILY_WORKER_FILTERS,
  type DailyWorkersFilterValues,
} from "@/components/daily-workers/daily-workers-filters";
import type { DailyWorkerTableRow } from "@/lib/daily-workers/types";
import { summarizeDailyWorkerFilters } from "@/lib/export/filter-summaries";
import { filterDailyWorkers } from "@/lib/filters/daily-workers";
import { exportDailyWorkersExcel } from "@/modules/daily-workers/export";
import { NewEntriesControls } from "@/components/layout/new-entries-controls";
import { listUnreadTenantChangeEntityIdsAction } from "@/lib/realtime/sync-actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type DailyWorkersTableProps = {
  dailyWorkers: DailyWorkerTableRow[];
  year: number;
  month: number;
  companyId?: string;
  companyName?: string;
  basePath?: string;
  embedded?: boolean;
};

function clearShowUnreadParam(
  basePath: string,
  searchParams: URLSearchParams,
): string {
  const params = new URLSearchParams(searchParams.toString());
  params.delete("showUnread");
  return `${basePath}?${params.toString()}`;
}

export function DailyWorkersTable({
  dailyWorkers,
  year,
  month,
  companyId,
  companyName,
  basePath = "/client/daily-workers",
  embedded = false,
}: DailyWorkersTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showUnread = searchParams.get("showUnread") === "1";
  const [unreadIds, setUnreadIds] = useState<Set<string> | null>(null);
  const [reviewActive, setReviewActive] = useState(false);
  const [draftFilters, setDraftFilters] = useState<DailyWorkersFilterValues>(
    EMPTY_DAILY_WORKER_FILTERS,
  );
  const [appliedFilters, setAppliedFilters] = useState<DailyWorkersFilterValues>(
    EMPTY_DAILY_WORKER_FILTERS,
  );

  const defaultTitle = `${year}년 ${month}월 일용직 정보`;

  const filteredDailyWorkers = useMemo(
    () => filterDailyWorkers(dailyWorkers, appliedFilters),
    [dailyWorkers, appliedFilters],
  );

  const visibleDailyWorkers = useMemo(() => {
    if (!unreadIds) {
      return filteredDailyWorkers;
    }
    return filteredDailyWorkers.filter((row) => unreadIds.has(row.id));
  }, [filteredDailyWorkers, unreadIds]);

  const filterSummary = useMemo(
    () => summarizeDailyWorkerFilters(year, month, appliedFilters),
    [year, month, appliedFilters],
  );

  function showUnreadEntriesForPeriod(ids: string[]) {
    setDraftFilters(EMPTY_DAILY_WORKER_FILTERS);
    setAppliedFilters(EMPTY_DAILY_WORKER_FILTERS);
    setUnreadIds(new Set(ids));
  }

  useEffect(() => {
    if (!companyId || !showUnread) {
      return;
    }

    router.replace(
      clearShowUnreadParam(basePath, new URLSearchParams(searchParams.toString())),
      { scroll: false },
    );

    void (async () => {
      const ids = await listUnreadTenantChangeEntityIdsAction({
        companyId,
        entityTypes: ["DAILY_WORKER"],
        periodYear: year,
        periodMonth: month,
      });
      showUnreadEntriesForPeriod(ids);
      setReviewActive(true);
    })();
  }, [basePath, companyId, month, router, searchParams, showUnread, year]);

  function handleDraftChange(next: DailyWorkersFilterValues) {
    setDraftFilters(next);
    setAppliedFilters(next);
  }

  function handleSearch() {
    setAppliedFilters(draftFilters);
  }

  function handleClear() {
    setDraftFilters(EMPTY_DAILY_WORKER_FILTERS);
    setAppliedFilters(EMPTY_DAILY_WORKER_FILTERS);
  }

  return (
    <Card className="min-w-0">
      <CardHeader
        className={`flex shrink-0 flex-row items-start gap-4 ${embedded ? "justify-end" : "justify-between"}`}
      >
        {embedded ? null : (
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="size-4 text-primary" />
              일용직 목록
            </CardTitle>
            <CardDescription>
              {year}년 {month}월로 등록된 일용직 정보를 확인하고 관리합니다.
            </CardDescription>
          </div>
        )}
        <div className="flex shrink-0 items-center gap-2">
          {companyId ? (
            <NewEntriesControls
              companyId={companyId}
              entityTypes={["DAILY_WORKER"]}
              periodScope={{ year, month, basePath }}
              reviewActive={reviewActive}
              onReviewActiveChange={setReviewActive}
              onShowUnreadEntries={showUnreadEntriesForPeriod}
              onClearUnreadFilter={() => setUnreadIds(null)}
            />
          ) : null}
          <ExcelExportDialog
            moduleLabel="일용직 정보"
            defaultTitle={defaultTitle}
            companyName={companyName}
            filterSummary={filterSummary}
            entryCount={visibleDailyWorkers.length}
            disabled={reviewActive}
            companyId={companyId}
            onExport={({ title }) =>
              exportDailyWorkersExcel({
                title,
                year,
                month,
                filters: appliedFilters,
                companyId,
              })
            }
          />
          <DailyWorkerFormDialog
            mode="create"
            year={year}
            month={month}
            companyId={companyId}
            disabled={reviewActive}
          />
        </div>
      </CardHeader>
      <CardContent className="min-w-0">
        {dailyWorkers.length === 0 ? (
          <div className="space-y-4">
            <DailyWorkersMonthSelector
              year={year}
              month={month}
              basePath={basePath}
              disabled={reviewActive}
            />
            <EmptyState message="등록된 일용직이 없습니다. 일용직 등록 버튼으로 첫 항목을 추가해 주세요." />
          </div>
        ) : (
          <DailyWorkersTableView
            dailyWorkers={visibleDailyWorkers}
            year={year}
            month={month}
            companyId={companyId}
            basePath={basePath}
            hasBaseRows={dailyWorkers.length > 0}
            draftFilters={draftFilters}
            appliedFilters={appliedFilters}
            onDraftChange={handleDraftChange}
            onSearch={handleSearch}
            onClear={handleClear}
            disabled={reviewActive}
          />
        )}
      </CardContent>
    </Card>
  );
}
