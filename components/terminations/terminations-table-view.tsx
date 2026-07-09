"use client";

import { useEffect, useMemo, useState } from "react";

import { TerminationFormDialog } from "@/components/client/termination-form-dialog";
import { TerminationsDataTable } from "@/components/terminations/terminations-data-table";
import { TerminationsFilters } from "@/components/terminations/terminations-filters";
import {
  filterTerminations,
  type TerminationFilterValues,
} from "@/lib/filters/terminations";
import { formatDate } from "@/lib/format/date";
import type { TerminationTableRow } from "@/lib/terminations/types";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { paginate } from "@/lib/pagination";
import { deleteTerminationAction } from "@/modules/terminations/actions";

type TerminationsTableViewProps = {
  terminations: TerminationTableRow[];
  companyId?: string;
  hasBaseRows: boolean;
  draftFilters: TerminationFilterValues;
  appliedFilters: TerminationFilterValues;
  onDraftChange: (next: TerminationFilterValues) => void;
  onSearch: () => void;
  onClear: () => void;
};

function toFormDateValue(date: Date | null) {
  if (!date) {
    return null;
  }
  return formatDate(date);
}

export function TerminationsTableView({
  terminations,
  companyId,
  hasBaseRows,
  draftFilters,
  appliedFilters,
  onDraftChange,
  onSearch,
  onClear,
}: TerminationsTableViewProps) {
  const [page, setPage] = useState(1);

  const filteredTerminations = useMemo(
    () => filterTerminations(terminations, appliedFilters),
    [terminations, appliedFilters],
  );

  const pagination = useMemo(
    () => paginate(filteredTerminations, page),
    [filteredTerminations, page],
  );

  useEffect(() => {
    setPage(1);
  }, [appliedFilters]);

  useEffect(() => {
    if (page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [page, pagination.totalPages]);

  function renderActions(termination: TerminationTableRow) {
    return (
      <>
        <TerminationFormDialog
          mode="edit"
          companyId={companyId}
          termination={{
            id: termination.id,
            name: termination.name,
            hireDate: toFormDateValue(termination.hireDate),
            terminationDate: toFormDateValue(termination.terminationDate) ?? "",
            reason: termination.reason,
            retirementPayType: termination.retirementPayType,
            notes: termination.notes,
          }}
        />
        <ConfirmDeleteDialog
          title="퇴사자 정보 삭제"
          description={`"${termination.name}" 퇴사자 정보를 삭제하시겠습니까? 삭제된 항목은 복구할 수 없습니다.`}
          action={deleteTerminationAction}
          hiddenFields={{
            id: termination.id,
            ...(companyId ? { companyId } : {}),
          }}
          triggerLabel="삭제"
        />
      </>
    );
  }

  return (
    <div className="space-y-3">
      <TerminationsFilters
        draft={draftFilters}
        onDraftChange={onDraftChange}
        onSearch={onSearch}
        onClear={onClear}
      />

      {filteredTerminations.length === 0 ? (
        <div className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          {hasBaseRows ? "검색 조건에 맞는 퇴사자가 없습니다." : "등록된 퇴사자가 없습니다."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <TerminationsDataTable
            terminations={pagination.items}
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
