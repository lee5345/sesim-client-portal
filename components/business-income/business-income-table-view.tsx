"use client";

import { useEffect, useMemo, useState } from "react";

import { BusinessIncomeFormDialog } from "@/components/client/business-income-form-dialog";
import { BusinessIncomeDataTable } from "@/components/business-income/business-income-data-table";
import {
  BusinessIncomeFilters,
  type BusinessIncomeFiltersValues,
} from "@/components/business-income/business-income-filters";
import type { BusinessIncomeTableRow } from "@/lib/business-income/types";
import { filterBusinessIncomes } from "@/lib/filters/business-income";
import { paginate } from "@/lib/pagination";
import { deleteBusinessIncomeAction } from "@/modules/business-income/actions";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { EMPTY_BUSINESS_INCOME_FILTERS } from "@/lib/filters/business-income";

type BusinessIncomeTableViewProps = {
  businessIncomes: BusinessIncomeTableRow[];
  year: number;
  month: number;
  companyId?: string;
  hasBaseRows: boolean;
  draftFilters: BusinessIncomeFiltersValues;
  appliedFilters: BusinessIncomeFiltersValues;
  onDraftChange: (next: BusinessIncomeFiltersValues) => void;
  onSearch: () => void;
  onClear: () => void;
  disabled?: boolean;
};

export function BusinessIncomeTableView({
  businessIncomes,
  year,
  month,
  companyId,
  hasBaseRows,
  draftFilters,
  appliedFilters,
  onDraftChange,
  onSearch,
  onClear,
  disabled = false,
}: BusinessIncomeTableViewProps) {
  const [page, setPage] = useState(1);

  const filteredBusinessIncomes = useMemo(
    () => filterBusinessIncomes(businessIncomes, appliedFilters),
    [businessIncomes, appliedFilters],
  );

  const pagination = useMemo(
    () => paginate(filteredBusinessIncomes, page),
    [filteredBusinessIncomes, page],
  );

  useEffect(() => {
    setPage(1);
  }, [appliedFilters]);

  useEffect(() => {
    if (page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [page, pagination.totalPages]);

  function renderActions(businessIncome: BusinessIncomeTableRow) {
    return (
      <>
        <BusinessIncomeFormDialog
          mode="edit"
          year={year}
          month={month}
          companyId={companyId}
          businessIncome={{
            id: businessIncome.id,
            name: businessIncome.name,
            incomeAmount: businessIncome.incomeAmount,
            incomeBasis: businessIncome.incomeBasis,
            notes: businessIncome.notes,
          }}
        />
        <ConfirmDeleteDialog
          title="사업소득 정보 삭제"
          description={`"${businessIncome.name}" 사업소득 정보를 삭제하시겠습니까? 삭제된 항목은 복구할 수 없습니다.`}
          action={deleteBusinessIncomeAction}
          hiddenFields={{
            id: businessIncome.id,
            ...(companyId ? { companyId } : {}),
          }}
          triggerLabel="삭제"
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <BusinessIncomeFilters
        draft={draftFilters}
        onDraftChange={onDraftChange}
        onSearch={onSearch}
        onClear={onClear}
      />

      {filteredBusinessIncomes.length === 0 ? (
        <div className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          {hasBaseRows
            ? "검색 조건에 맞는 사업소득 정보가 없습니다."
            : "등록된 사업소득 정보가 없습니다."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <BusinessIncomeDataTable
            businessIncomes={pagination.items}
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
