"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { CalendarDays, Copy } from "lucide-react";

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
import {
  copyDailyWorkerNamesFromMostRecentMonth,
  getDailyWorkerMostRecentMonthWithData,
} from "@/modules/daily-workers/actions";
import { exportDailyWorkersExcel } from "@/modules/daily-workers/export";
import { NewEntriesControls } from "@/components/layout/new-entries-controls";
import { listUnreadTenantChangeEntityIdsAction } from "@/lib/realtime/sync-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [isPending, startTransition] = useTransition();
  const [unreadIds, setUnreadIds] = useState<Set<string> | null>(null);
  const [reviewActive, setReviewActive] = useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [copyModeDialogOpen, setCopyModeDialogOpen] = useState(false);
  const [copySourceYearMonth, setCopySourceYearMonth] = useState<{
    year: number;
    month: number;
  } | null>(null);
  const [draftFilters, setDraftFilters] = useState<DailyWorkersFilterValues>(
    EMPTY_DAILY_WORKER_FILTERS,
  );
  const [appliedFilters, setAppliedFilters] = useState<DailyWorkersFilterValues>(
    EMPTY_DAILY_WORKER_FILTERS,
  );

  const defaultTitle = `${year}년 ${month}월 일용직 정보`;
  const chromeLocked = reviewActive || isPending;

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

  useEffect(() => {
    if (!companyId || (!copyDialogOpen && !copyModeDialogOpen)) {
      return;
    }

    let cancelled = false;
    setCopySourceYearMonth(null);

    void (async () => {
      const source = await getDailyWorkerMostRecentMonthWithData({
        companyId,
        year,
        month,
      });
      if (cancelled) return;
      setCopySourceYearMonth(source);
    })();

    return () => {
      cancelled = true;
    };
  }, [companyId, copyDialogOpen, copyModeDialogOpen, month, year]);

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

  function handleCopyClick() {
    if (dailyWorkers.length > 0) {
      setCopyModeDialogOpen(true);
      return;
    }
    setCopyDialogOpen(true);
  }

  function runCopy(mode: "overwrite" | "append") {
    if (!companyId) {
      return;
    }

    startTransition(async () => {
      await copyDailyWorkerNamesFromMostRecentMonth({
        companyId,
        year,
        month,
        mode,
      });
      setCopyDialogOpen(false);
      setCopyModeDialogOpen(false);
      router.refresh();
    });
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
            disabled={chromeLocked}
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
            disabled={chromeLocked}
          />
        </div>
      </CardHeader>
      <CardContent className="min-w-0 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <DailyWorkersMonthSelector
            year={year}
            month={month}
            basePath={basePath}
            disabled={chromeLocked}
          />
          <Button
            type="button"
            variant="outline"
            className="h-8 shrink-0 self-end"
            disabled={chromeLocked || !companyId}
            onClick={handleCopyClick}
          >
            <Copy className="size-4" />
            최근 인원 복사
          </Button>
        </div>

        {dailyWorkers.length === 0 ? (
          <EmptyState message="등록된 일용직이 없습니다. 일용직 등록 버튼으로 첫 항목을 추가하거나 최근 월 인원을 복사해 주세요." />
        ) : (
          <DailyWorkersTableView
            dailyWorkers={visibleDailyWorkers}
            year={year}
            month={month}
            companyId={companyId}
            hasBaseRows={dailyWorkers.length > 0}
            draftFilters={draftFilters}
            appliedFilters={appliedFilters}
            onDraftChange={handleDraftChange}
            onSearch={handleSearch}
            onClear={handleClear}
            disabled={chromeLocked}
          />
        )}
      </CardContent>

      <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>최근 인원 복사</DialogTitle>
            <DialogDescription>
              {copySourceYearMonth ? (
                <>
                  가장 최근에 기록이 있는 {copySourceYearMonth.year}년{" "}
                  {copySourceYearMonth.month}월의 인원 목록을 {year}년 {month}월로
                  복사합니다.
                </>
              ) : (
                <>
                  가장 최근에 기록이 있는 월의 인원 목록을 {year}년 {month}월로
                  복사합니다.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCopyDialogOpen(false)}
              disabled={isPending}
            >
              취소
            </Button>
            <Button
              type="button"
              disabled={isPending}
              onClick={() => runCopy("append")}
            >
              복사
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={copyModeDialogOpen} onOpenChange={setCopyModeDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>복사 방식 선택</DialogTitle>
            <DialogDescription>
              {year}년 {month}월에 이미 등록된 항목이 있습니다. 덮어쓰기는 기존
              항목을 삭제한 뒤 이름·주민번호·직종만 복사하고, 추가하기는 기존
              인원을 유지한 채 새 인원만 추가합니다.
              {copySourceYearMonth ? (
                <span className="mt-2 block">
                  복사 대상 기간: {copySourceYearMonth.year}년{" "}
                  {copySourceYearMonth.month}월
                </span>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCopyModeDialogOpen(false)}
              disabled={isPending}
            >
              취소
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => runCopy("append")}
            >
              추가하기
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={() => runCopy("overwrite")}
            >
              덮어쓰기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
