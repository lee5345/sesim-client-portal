"use client";

import { useMemo, useState } from "react";
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
};

export function DailyWorkersTable({
  dailyWorkers,
  year,
  month,
  companyId,
  companyName,
  basePath = "/client/daily-workers",
}: DailyWorkersTableProps) {
  const [unreadIds, setUnreadIds] = useState<Set<string> | null>(null);
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
      <CardHeader className="flex shrink-0 flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="size-4 text-primary" />
            일용직 목록
          </CardTitle>
          <CardDescription>
            {year}년 {month}월 일용직 근로시간과 임금 정보를 관리합니다.
          </CardDescription>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {companyId ? (
            <NewEntriesControls
              companyId={companyId}
              entityTypes={["DAILY_WORKER"]}
              onShowUnreadEntries={(ids) => {
                setDraftFilters(EMPTY_DAILY_WORKER_FILTERS);
                setAppliedFilters(EMPTY_DAILY_WORKER_FILTERS);
                setUnreadIds(new Set(ids));
              }}
              onClearUnreadFilter={() => setUnreadIds(null)}
            />
          ) : null}
          <ExcelExportDialog
            moduleLabel="일용직 정보"
            defaultTitle={defaultTitle}
            companyName={companyName}
            filterSummary={filterSummary}
            entryCount={visibleDailyWorkers.length}
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
          />
        </div>
      </CardHeader>
      <CardContent className="min-w-0">
        {dailyWorkers.length === 0 ? (
          <div className="space-y-4">
            <DailyWorkersMonthSelector year={year} month={month} basePath={basePath} />
            <EmptyState message="등록된 일용직이 없습니다. 일용직 등록 버튼으로 첫 항목을 추가해 주세요." />
          </div>
        ) : (
          <DailyWorkersTableView
            dailyWorkers={visibleDailyWorkers}
            year={year}
            month={month}
            companyId={companyId}
            basePath={basePath}
            draftFilters={draftFilters}
            appliedFilters={appliedFilters}
            onDraftChange={handleDraftChange}
            onSearch={handleSearch}
            onClear={handleClear}
          />
        )}
      </CardContent>
    </Card>
  );
}
