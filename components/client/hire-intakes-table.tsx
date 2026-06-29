"use client";

import { useMemo, useState } from "react";
import { UserPlus } from "lucide-react";

import { HireIntakeFormDialog } from "@/components/client/hire-intake-form-dialog";
import { ExcelExportDialog } from "@/components/export/excel-export-dialog";
import { EmptyState } from "@/components/dashboard/empty-state";
import type { HireIntakeTableRow } from "@/components/hire-intakes/hire-intakes-data-table";
import {
  EMPTY_HIRE_INTAKE_FILTERS,
  type HireIntakeFilterValues,
} from "@/components/hire-intakes/hire-intakes-filters";
import { HireIntakesTableView } from "@/components/hire-intakes/hire-intakes-table-view";
import { summarizeHireIntakeFilters } from "@/lib/export/filter-summaries";
import { filterHireIntakes } from "@/lib/filters/hire-intakes";
import { exportHireIntakesExcel } from "@/modules/hire-intakes/export";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type DepartmentOption = {
  id: string;
  name: string;
};

type HireIntakesTableProps = {
  hireIntakes: HireIntakeTableRow[];
  departments: DepartmentOption[];
  companyId?: string;
};

export function HireIntakesTable({
  hireIntakes,
  departments,
  companyId,
}: HireIntakesTableProps) {
  const [draftFilters, setDraftFilters] = useState<HireIntakeFilterValues>(
    EMPTY_HIRE_INTAKE_FILTERS,
  );
  const [appliedFilters, setAppliedFilters] = useState<HireIntakeFilterValues>(
    EMPTY_HIRE_INTAKE_FILTERS,
  );

  const filteredHireIntakes = useMemo(
    () => filterHireIntakes(hireIntakes, appliedFilters),
    [hireIntakes, appliedFilters],
  );

  const filterSummary = useMemo(
    () => summarizeHireIntakeFilters(appliedFilters),
    [appliedFilters],
  );

  function handleDraftChange(next: HireIntakeFilterValues) {
    setDraftFilters(next);
    setAppliedFilters(next);
  }

  function handleSearch() {
    setAppliedFilters(draftFilters);
  }

  function handleClear() {
    setDraftFilters(EMPTY_HIRE_INTAKE_FILTERS);
    setAppliedFilters(EMPTY_HIRE_INTAKE_FILTERS);
  }

  return (
    <Card className="min-w-0">
      <CardHeader className="flex shrink-0 flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="size-4 text-primary" />
            입사자 목록
          </CardTitle>
          <CardDescription>등록된 입사자 정보를 확인하고 관리합니다.</CardDescription>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ExcelExportDialog
            moduleLabel="입사자 정보"
            defaultTitle="입사자 정보"
            filterSummary={filterSummary}
            entryCount={filteredHireIntakes.length}
            companyId={companyId}
            onExport={({ title }) =>
              exportHireIntakesExcel({
                title,
                filters: appliedFilters,
                companyId,
              })
            }
          />
          <HireIntakeFormDialog
            mode="create"
            departments={departments}
            companyId={companyId}
          />
        </div>
      </CardHeader>
      <CardContent className="min-w-0">
        {hireIntakes.length === 0 ? (
          <EmptyState message="등록된 입사자가 없습니다. 입사자 등록 버튼으로 첫 항목을 추가해 주세요." />
        ) : (
          <HireIntakesTableView
            hireIntakes={hireIntakes}
            departments={departments}
            companyId={companyId}
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
