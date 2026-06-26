"use client";

import { useEffect, useMemo, useState } from "react";

import { DailyWorkerFormDialog } from "@/components/client/daily-worker-form-dialog";
import { DailyWorkersDataTable } from "@/components/daily-workers/daily-workers-data-table";
import {
  DailyWorkersFilters,
  EMPTY_DAILY_WORKER_FILTERS,
  type DailyWorkersFilterValues,
} from "@/components/daily-workers/daily-workers-filters";
import { DailyWorkersMonthSelector } from "@/components/daily-workers/daily-workers-month-selector";
import type { DailyWorkerTableRow } from "@/lib/daily-workers/types";
import { filterDailyWorkers } from "@/lib/filters/daily-workers";
import { paginate } from "@/lib/pagination";
import { deleteDailyWorkerAction } from "@/modules/daily-workers/actions";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { DataTablePagination } from "@/components/ui/data-table-pagination";

type DailyWorkersTableViewProps = {
  dailyWorkers: DailyWorkerTableRow[];
  year: number;
  month: number;
  companyId?: string;
  basePath: string;
};

export function DailyWorkersTableView({
  dailyWorkers,
  year,
  month,
  companyId,
  basePath,
}: DailyWorkersTableViewProps) {
  const [draftFilters, setDraftFilters] = useState<DailyWorkersFilterValues>(
    EMPTY_DAILY_WORKER_FILTERS,
  );
  const [appliedFilters, setAppliedFilters] = useState<DailyWorkersFilterValues>(
    EMPTY_DAILY_WORKER_FILTERS,
  );
  const [page, setPage] = useState(1);

  const filteredDailyWorkers = useMemo(
    () => filterDailyWorkers(dailyWorkers, appliedFilters),
    [dailyWorkers, appliedFilters],
  );

  const pagination = useMemo(
    () => paginate(filteredDailyWorkers, page),
    [filteredDailyWorkers, page],
  );

  useEffect(() => {
    if (page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [page, pagination.totalPages]);

  function handleDraftChange(next: DailyWorkersFilterValues) {
    setDraftFilters(next);
    setAppliedFilters(next);
    setPage(1);
  }

  function handleSearch() {
    setAppliedFilters(draftFilters);
    setPage(1);
  }

  function handleClear() {
    setDraftFilters(EMPTY_DAILY_WORKER_FILTERS);
    setAppliedFilters(EMPTY_DAILY_WORKER_FILTERS);
    setPage(1);
  }

  function renderActions(dailyWorker: DailyWorkerTableRow) {
    return (
      <>
        <DailyWorkerFormDialog
          mode="edit"
          year={year}
          month={month}
          companyId={companyId}
          dailyWorker={{
            id: dailyWorker.id,
            name: dailyWorker.name,
            occupation: dailyWorker.occupation,
            salaryBasis: dailyWorker.salaryBasis,
            totalWage: dailyWorker.totalWage,
            hours: dailyWorker.hours,
            notes: dailyWorker.notes,
          }}
        />
        <ConfirmDeleteDialog
          title="일용직 정보 삭제"
          description={`"${dailyWorker.name}" 일용직 정보를 삭제하시겠습니까? 삭제된 항목은 복구할 수 없습니다.`}
          action={deleteDailyWorkerAction}
          hiddenFields={{
            id: dailyWorker.id,
            ...(companyId ? { companyId } : {}),
          }}
          triggerLabel="삭제"
        />
      </>
    );
  }

  return (
    <div className="space-y-3">
      <DailyWorkersMonthSelector year={year} month={month} basePath={basePath} />

      <DailyWorkersFilters
        draft={draftFilters}
        onDraftChange={handleDraftChange}
        onSearch={handleSearch}
        onClear={handleClear}
      />

      {filteredDailyWorkers.length === 0 ? (
        <div className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          {dailyWorkers.length === 0
            ? `${year}년 ${month}월에 등록된 일용직이 없습니다.`
            : "검색 조건에 맞는 일용직이 없습니다."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <DailyWorkersDataTable
            dailyWorkers={pagination.items}
            year={year}
            month={month}
            companyId={companyId}
            renderActions={renderActions}
          />
          <DataTablePagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            rangeStart={pagination.rangeStart}
            rangeEnd={pagination.rangeEnd}
            total={pagination.total}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
