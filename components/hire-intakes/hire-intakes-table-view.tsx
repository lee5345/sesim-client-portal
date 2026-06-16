"use client";

import { useEffect, useMemo, useState } from "react";

import { deleteHireIntakeAction } from "@/modules/hire-intakes/actions";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { HireIntakeFormDialog } from "@/components/client/hire-intake-form-dialog";
import {
  HireIntakesDataTable,
  type HireIntakeTableRow,
} from "@/components/hire-intakes/hire-intakes-data-table";
import {
  EMPTY_HIRE_INTAKE_FILTERS,
  HireIntakesFilters,
  type HireIntakeFilterValues,
} from "@/components/hire-intakes/hire-intakes-filters";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { filterHireIntakes } from "@/lib/filters/hire-intakes";
import { paginate } from "@/lib/pagination";

type DepartmentOption = {
  id: string;
  name: string;
};

type HireIntakesTableViewProps = {
  hireIntakes: HireIntakeTableRow[];
  departments: DepartmentOption[];
  companyId?: string;
};

function toFormDateValue(date: Date | null) {
  if (!date) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

export function HireIntakesTableView({
  hireIntakes,
  departments,
  companyId,
}: HireIntakesTableViewProps) {
  const [draftFilters, setDraftFilters] = useState<HireIntakeFilterValues>(
    EMPTY_HIRE_INTAKE_FILTERS,
  );
  const [appliedFilters, setAppliedFilters] = useState<HireIntakeFilterValues>(
    EMPTY_HIRE_INTAKE_FILTERS,
  );
  const [page, setPage] = useState(1);

  const filteredHireIntakes = useMemo(
    () => filterHireIntakes(hireIntakes, appliedFilters),
    [hireIntakes, appliedFilters],
  );

  const pagination = useMemo(
    () => paginate(filteredHireIntakes, page),
    [filteredHireIntakes, page],
  );

  useEffect(() => {
    if (page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [page, pagination.totalPages]);

  function handleDraftChange(next: HireIntakeFilterValues) {
    setDraftFilters(next);
    setAppliedFilters(next);
    setPage(1);
  }

  function handleSearch() {
    setAppliedFilters(draftFilters);
    setPage(1);
  }

  function handleClear() {
    setDraftFilters(EMPTY_HIRE_INTAKE_FILTERS);
    setAppliedFilters(EMPTY_HIRE_INTAKE_FILTERS);
    setPage(1);
  }

  function renderActions(hireIntake: HireIntakeTableRow) {
    return (
      <>
        <HireIntakeFormDialog
          mode="edit"
          departments={departments}
          companyId={companyId}
          hireIntake={{
            id: hireIntake.id,
            name: hireIntake.name,
            email: hireIntake.email,
            hireDate: toFormDateValue(hireIntake.hireDate) ?? "",
            department: hireIntake.department,
            salaryType: hireIntake.salaryType,
            salaryBasis: hireIntake.salaryBasis,
            salaryAmount: hireIntake.salaryAmount,
            isContract: hireIntake.isContract,
            contractStart: toFormDateValue(hireIntake.contractStart),
            contractEnd: toFormDateValue(hireIntake.contractEnd),
            nonTaxableAllowances: hireIntake.nonTaxableAllowances,
            bankName: hireIntake.bankName,
            accountNumber: hireIntake.accountNumber,
            phone: hireIntake.phone,
            notes: hireIntake.notes,
          }}
        />
        <ConfirmDeleteDialog
          title="입사자 정보 삭제"
          description={`"${hireIntake.name}" 입사자 정보를 삭제하시겠습니까? 삭제된 항목은 복구할 수 없습니다.`}
          action={deleteHireIntakeAction}
          hiddenFields={{
            id: hireIntake.id,
            ...(companyId ? { companyId } : {}),
          }}
          triggerLabel="삭제"
        />
      </>
    );
  }

  return (
    <div className="space-y-3">
      <HireIntakesFilters
        departments={departments}
        draft={draftFilters}
        onDraftChange={handleDraftChange}
        onSearch={handleSearch}
        onClear={handleClear}
      />

      {filteredHireIntakes.length === 0 ? (
        <div className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          {hireIntakes.length === 0
            ? "등록된 입사자가 없습니다."
            : "검색 조건에 맞는 입사자가 없습니다."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <HireIntakesDataTable
            hireIntakes={pagination.items}
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
