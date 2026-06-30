"use client";

import { useMemo, useState } from "react";
import { UserMinus } from "lucide-react";

import { TerminationFormDialog } from "@/components/client/termination-form-dialog";
import { ExcelExportDialog } from "@/components/export/excel-export-dialog";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  TerminationsTableView,
} from "@/components/terminations/terminations-table-view";
import type { TerminationTableRow } from "@/lib/terminations/types";
import {
  EMPTY_TERMINATION_FILTERS,
  filterTerminations,
  type TerminationFilterValues,
} from "@/lib/filters/terminations";
import { summarizeTerminationFilters } from "@/lib/export/filter-summaries";
import { exportTerminationsExcel } from "@/modules/terminations/export";
import { NewEntriesControls } from "@/components/layout/new-entries-controls";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type TerminationsTableProps = {
  terminations: TerminationTableRow[];
  companyId?: string;
  companyName?: string;
};

export function TerminationsTable({
  terminations,
  companyId,
  companyName,
}: TerminationsTableProps) {
  const [unreadIds, setUnreadIds] = useState<Set<string> | null>(null);
  const [draftFilters, setDraftFilters] = useState<TerminationFilterValues>(
    EMPTY_TERMINATION_FILTERS,
  );
  const [appliedFilters, setAppliedFilters] = useState<TerminationFilterValues>(
    EMPTY_TERMINATION_FILTERS,
  );

  const filteredTerminations = useMemo(
    () => filterTerminations(terminations, appliedFilters),
    [terminations, appliedFilters],
  );

  const visibleTerminations = useMemo(() => {
    if (!unreadIds) {
      return filteredTerminations;
    }
    return filteredTerminations.filter((row) => unreadIds.has(row.id));
  }, [filteredTerminations, unreadIds]);

  const filterSummary = useMemo(
    () => summarizeTerminationFilters(appliedFilters),
    [appliedFilters],
  );

  function handleDraftChange(next: TerminationFilterValues) {
    setDraftFilters(next);
    setAppliedFilters(next);
  }

  function handleSearch() {
    setAppliedFilters(draftFilters);
  }

  function handleClear() {
    setDraftFilters(EMPTY_TERMINATION_FILTERS);
    setAppliedFilters(EMPTY_TERMINATION_FILTERS);
  }

  return (
    <Card className="min-w-0">
      <CardHeader className="flex shrink-0 flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserMinus className="size-4 text-primary" />
            퇴사자 목록
          </CardTitle>
          <CardDescription>등록된 퇴사자 정보를 확인하고 관리합니다.</CardDescription>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {companyId ? (
            <NewEntriesControls
              companyId={companyId}
              entityTypes={["TERMINATION"]}
              onShowUnreadEntries={(ids) => {
                setDraftFilters(EMPTY_TERMINATION_FILTERS);
                setAppliedFilters(EMPTY_TERMINATION_FILTERS);
                setUnreadIds(new Set(ids));
              }}
              onClearUnreadFilter={() => setUnreadIds(null)}
            />
          ) : null}
          <ExcelExportDialog
            moduleLabel="퇴사자 정보"
            defaultTitle="퇴사자 정보"
            companyName={companyName}
            filterSummary={filterSummary}
            entryCount={visibleTerminations.length}
            companyId={companyId}
            onExport={({ title }) =>
              exportTerminationsExcel({
                title,
                filters: appliedFilters,
                companyId,
              })
            }
          />
          <TerminationFormDialog mode="create" companyId={companyId} />
        </div>
      </CardHeader>
      <CardContent className="min-w-0">
        {terminations.length === 0 ? (
          <EmptyState message="등록된 퇴사자가 없습니다. 퇴사자 등록 버튼으로 첫 항목을 추가해 주세요." />
        ) : (
          <TerminationsTableView
            terminations={visibleTerminations}
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
