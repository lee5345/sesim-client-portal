"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Wallet, X } from "lucide-react";

import { CompensationChangeFormDialog } from "@/components/client/compensation-change-form-dialog";
import { ExcelExportDialog } from "@/components/export/excel-export-dialog";
import { EmptyState } from "@/components/dashboard/empty-state";
import { NewEntriesControls } from "@/components/layout/new-entries-controls";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { DateInput } from "@/components/ui/date-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CompactDateTime } from "@/components/ui/compact-datetime";
import { formatSalaryAmount } from "@/lib/format/currency";
import {
  EMPTY_COMPENSATION_CHANGE_FILTERS,
  filterCompensationChanges,
  type CompensationChangeFilterValues,
} from "@/lib/filters/compensation-changes";
import { summarizeCompensationChangeFilters } from "@/lib/export/filter-summaries";
import type { SalaryBasis, SalaryType } from "@/lib/generated/prisma/client";
import { paginate } from "@/lib/pagination";
import { SALARY_BASIS_LABELS, SALARY_TYPE_LABELS } from "@/modules/hire-intakes/labels";
import { deleteCompensationChangeAction } from "@/modules/compensation-changes/actions";
import { exportCompensationChangesExcel } from "@/modules/compensation-changes/export";
import { DataTablePagination } from "@/components/ui/data-table-pagination";

type CompensationChangeRow = {
  id: string;
  name: string;
  changeDate: string;
  salaryTypeBefore: SalaryType;
  salaryBasisBefore: SalaryBasis;
  salaryAmountBefore: number;
  salaryTypeAfter: SalaryType;
  salaryBasisAfter: SalaryBasis;
  salaryAmountAfter: number;
  notes: string | null;
  createdAt: string;
  createdByName: string;
};

type CompensationChangesTableProps = {
  compensationChanges: CompensationChangeRow[];
  companyId?: string;
  companyName?: string;
  embedded?: boolean;
};

const EMPTY_CELL = "—";

const headerCellClassName =
  "border-r border-border/30 px-4 py-3 font-medium whitespace-nowrap last:border-r-0";
const bodyCellClassName =
  "border-r border-border/30 px-4 py-3 whitespace-nowrap last:border-r-0";
const stickyNameHeaderClassName =
  "sticky left-0 z-40 border-r border-border bg-muted px-4 py-3 font-medium whitespace-nowrap shadow-[10px_0_20px_-10px_rgba(0,0,0,0.15)]";
const stickyNameCellClassName =
  "sticky left-0 z-30 border-r border-border bg-muted px-4 py-3 whitespace-nowrap shadow-[10px_0_20px_-10px_rgba(0,0,0,0.12)] group-hover:bg-muted";
const stickyActionHeaderClassName =
  "sticky right-0 z-30 border-l border-border bg-muted px-4 py-3 text-center font-medium whitespace-nowrap shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.15)]";
const stickyActionCellClassName =
  "sticky right-0 z-20 border-l border-border bg-muted px-4 py-3 text-center whitespace-nowrap shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.12)] group-hover:bg-muted";

function displayText(value: string | null | undefined) {
  return value?.trim() ? value : EMPTY_CELL;
}

export function CompensationChangesTable({
  compensationChanges,
  companyId,
  companyName,
  embedded = false,
}: CompensationChangesTableProps) {
  const [unreadIds, setUnreadIds] = useState<Set<string> | null>(null);
  const [reviewActive, setReviewActive] = useState(false);
  const [draftFilters, setDraftFilters] = useState<CompensationChangeFilterValues>(
    EMPTY_COMPENSATION_CHANGE_FILTERS,
  );
  const [appliedFilters, setAppliedFilters] = useState<CompensationChangeFilterValues>(
    EMPTY_COMPENSATION_CHANGE_FILTERS,
  );
  const [page, setPage] = useState(1);

  const visibleChanges = useMemo(() => {
    if (!unreadIds) {
      return compensationChanges;
    }
    return compensationChanges.filter((row) => unreadIds.has(row.id));
  }, [compensationChanges, unreadIds]);

  const filteredChanges = useMemo(
    () => filterCompensationChanges(visibleChanges, appliedFilters),
    [appliedFilters, visibleChanges],
  );

  const filterSummary = useMemo(
    () => summarizeCompensationChangeFilters(appliedFilters),
    [appliedFilters],
  );

  const pagination = useMemo(
    () => paginate(filteredChanges, page),
    [filteredChanges, page],
  );

  useEffect(() => {
    if (page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [page, pagination.totalPages]);

  function handleFilterChange(
    updater: (current: CompensationChangeFilterValues) => CompensationChangeFilterValues,
  ) {
    setPage(1);
    setDraftFilters((current) => {
      const next = updater(current);
      setAppliedFilters(next);
      return next;
    });
  }

  function onSearch() {
    setPage(1);
    setAppliedFilters(draftFilters);
  }

  function onClear() {
    setPage(1);
    setDraftFilters(EMPTY_COMPENSATION_CHANGE_FILTERS);
    setAppliedFilters(EMPTY_COMPENSATION_CHANGE_FILTERS);
  }

  return (
    <Card className="min-w-0">
      <CardHeader
        className={`flex shrink-0 flex-row items-start gap-4 ${embedded ? "justify-end" : "justify-between"}`}
      >
        {embedded ? null : (
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="size-4 text-primary" />
              급여변경 목록
            </CardTitle>
            <CardDescription>등록된 급여변경 내역을 확인하고 관리합니다.</CardDescription>
          </div>
        )}
        <div className="flex shrink-0 items-center gap-2">
          {companyId ? (
            <NewEntriesControls
              companyId={companyId}
              entityTypes={["COMPENSATION_CHANGE"]}
              reviewActive={reviewActive}
              onReviewActiveChange={setReviewActive}
              onShowUnreadEntries={(ids) => {
                setPage(1);
                setDraftFilters(EMPTY_COMPENSATION_CHANGE_FILTERS);
                setAppliedFilters(EMPTY_COMPENSATION_CHANGE_FILTERS);
                setUnreadIds(new Set(ids));
              }}
              onClearUnreadFilter={() => setUnreadIds(null)}
            />
          ) : null}
          <ExcelExportDialog
            moduleLabel="급여변경 정보"
            defaultTitle="급여변경 정보"
            companyName={companyName}
            filterSummary={filterSummary}
            entryCount={filteredChanges.length}
            disabled={reviewActive}
            companyId={companyId}
            onExport={({ title }) =>
              exportCompensationChangesExcel({
                title,
                filters: appliedFilters,
                companyId,
              })
            }
          />
          <CompensationChangeFormDialog
            mode="create"
            companyId={companyId}
            disabled={reviewActive}
          />
        </div>
      </CardHeader>
      <CardContent className="min-w-0 space-y-3">
        {compensationChanges.length === 0 ? (
          <EmptyState message="등록된 급여변경 내역이 없습니다. 급여변경 등록 버튼으로 첫 항목을 추가해 주세요." />
        ) : (
          <>
            <fieldset
              disabled={reviewActive}
              className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3 disabled:opacity-60"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Label htmlFor="compensation-change-name-filter">이름</Label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="compensation-change-name-filter"
                      value={draftFilters.name}
                      placeholder="이름으로 검색"
                      className="pl-8"
                      onChange={(event) => {
                        const name = event.target.value;
                        handleFilterChange((current) => ({ ...current, name }));
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          onSearch();
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>급여변경일</Label>
                  <div className="flex items-center gap-2">
                    <DateInput
                      id="compensation-change-date-from"
                      value={draftFilters.changeDateFrom}
                      onChange={(changeDateFrom) =>
                        handleFilterChange((current) => ({ ...current, changeDateFrom }))
                      }
                      className="w-[10.5rem]"
                    />
                    <span className="text-muted-foreground">~</span>
                    <DateInput
                      id="compensation-change-date-to"
                      value={draftFilters.changeDateTo}
                      onChange={(changeDateTo) =>
                        handleFilterChange((current) => ({ ...current, changeDateTo }))
                      }
                      className="w-[10.5rem]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button type="button" onClick={onSearch}>
                    <Search />
                    검색
                  </Button>
                  <Button type="button" variant="outline" onClick={onClear}>
                    <X />
                    필터 초기화
                  </Button>
                </div>
              </div>
            </fieldset>

            {filteredChanges.length === 0 ? (
              <div className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                검색 조건에 맞는 급여변경 내역이 없습니다.
              </div>
            ) : (
          <div className="overflow-hidden rounded-lg border">
            <div className="max-w-full min-w-0 overflow-x-auto">
              <table className="w-max min-w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left">
                    <th className={stickyNameHeaderClassName}>이름</th>
                    <th className={headerCellClassName}>급여변경일</th>
                    <th className={headerCellClassName}>변경 전 급여</th>
                    <th className={headerCellClassName}>변경 후 급여</th>
                    <th className={headerCellClassName}>비고</th>
                    <th className={headerCellClassName}>등록자</th>
                    <th className={headerCellClassName}>등록일</th>
                    <th className={stickyActionHeaderClassName}>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.items.map((row) => (
                    <tr
                      key={row.id}
                      className="group border-b last:border-0 hover:bg-muted/20"
                    >
                      <td className={stickyNameCellClassName}>{row.name}</td>
                      <td className={`${bodyCellClassName} text-muted-foreground`}>
                        {row.changeDate}
                      </td>
                      <td className={bodyCellClassName}>
                        <div className="space-y-0.5">
                          <div>
                            {SALARY_TYPE_LABELS[row.salaryTypeBefore]} ·{" "}
                            {SALARY_BASIS_LABELS[row.salaryBasisBefore]}
                          </div>
                          <div className="text-muted-foreground">
                            {formatSalaryAmount(row.salaryAmountBefore)}
                          </div>
                        </div>
                      </td>
                      <td className={bodyCellClassName}>
                        <div className="space-y-0.5">
                          <div>
                            {SALARY_TYPE_LABELS[row.salaryTypeAfter]} ·{" "}
                            {SALARY_BASIS_LABELS[row.salaryBasisAfter]}
                          </div>
                          <div className="text-muted-foreground">
                            {formatSalaryAmount(row.salaryAmountAfter)}
                          </div>
                        </div>
                      </td>
                      <td className={`${bodyCellClassName} text-muted-foreground`}>
                        {displayText(row.notes)}
                      </td>
                      <td className={bodyCellClassName}>{row.createdByName}</td>
                      <td className={bodyCellClassName}>
                        <CompactDateTime date={new Date(row.createdAt)} />
                      </td>
                      <td className={stickyActionCellClassName}>
                        <div className="flex justify-center gap-2 whitespace-nowrap">
                          <CompensationChangeFormDialog
                            mode="edit"
                            companyId={companyId}
                            disabled={reviewActive}
                            compensationChange={{
                              id: row.id,
                              name: row.name,
                              changeDate: row.changeDate,
                              salaryTypeBefore: row.salaryTypeBefore,
                              salaryBasisBefore: row.salaryBasisBefore,
                              salaryAmountBefore: row.salaryAmountBefore,
                              salaryTypeAfter: row.salaryTypeAfter,
                              salaryBasisAfter: row.salaryBasisAfter,
                              salaryAmountAfter: row.salaryAmountAfter,
                              notes: row.notes,
                            }}
                          />
                          <ConfirmDeleteDialog
                            title="급여변경 정보 삭제"
                            description={`"${row.name}" 급여변경 정보를 삭제하시겠습니까? 삭제된 항목은 복구할 수 없습니다.`}
                            action={deleteCompensationChangeAction}
                            hiddenFields={{
                              id: row.id,
                              ...(companyId ? { companyId } : {}),
                            }}
                            triggerLabel="삭제"
                            disabled={reviewActive}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <DataTablePagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              rangeStart={pagination.rangeStart}
              rangeEnd={pagination.rangeEnd}
              total={pagination.total}
              disabled={reviewActive}
              onPageChange={setPage}
            />
          </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

