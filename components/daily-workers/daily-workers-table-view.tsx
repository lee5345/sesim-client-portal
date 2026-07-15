"use client";

import { useEffect, useMemo, useState } from "react";

import { DailyWorkerFormDialog } from "@/components/client/daily-worker-form-dialog";
import { DailyWorkersDataTable } from "@/components/daily-workers/daily-workers-data-table";
import {
  DailyWorkersFilters,
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
  hasBaseRows: boolean;
  draftFilters: DailyWorkersFilterValues;
  appliedFilters: DailyWorkersFilterValues;
  onDraftChange: (next: DailyWorkersFilterValues) => void;
  onSearch: () => void;
  onClear: () => void;
  disabled?: boolean;
};

export function DailyWorkersTableView({
  dailyWorkers,
  year,
  month,
  companyId,
  basePath,
  hasBaseRows,
  draftFilters,
  appliedFilters,
  onDraftChange,
  onSearch,
  onClear,
  disabled = false,
}: DailyWorkersTableViewProps) {
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
    setPage(1);
  }, [appliedFilters]);

  useEffect(() => {
    if (page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [page, pagination.totalPages]);

  function renderActions(dailyWorker: DailyWorkerTableRow) {
    return (
      <>
        <DailyWorkerFormDialog
          mode="edit"
          year={year}
          month={month}
          companyId={companyId}
          disabled={disabled}
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
          disabled={disabled}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <DailyWorkersMonthSelector
        year={year}
        month={month}
        basePath={basePath}
        disabled={disabled}
      />

      <DailyWorkersFilters
        draft={draftFilters}
        onDraftChange={onDraftChange}
        onSearch={onSearch}
        onClear={onClear}
        disabled={disabled}
      />

      {filteredDailyWorkers.length === 0 ? (
        <div className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          {hasBaseRows ? "검색 조건에 맞는 일용직이 없습니다." : "등록된 일용직이 없습니다."}
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
            disabled={disabled}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
