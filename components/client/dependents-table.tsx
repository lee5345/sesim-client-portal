"use client";

import { useEffect, useMemo, useState } from "react";
import { Users } from "lucide-react";

import { DependentFormDialog } from "@/components/client/dependent-form-dialog";
import { EmptyState } from "@/components/dashboard/empty-state";
import { NewEntriesControls } from "@/components/layout/new-entries-controls";
import {
  DependentsFilters,
  EMPTY_DEPENDENT_FILTERS,
  type DependentFilterValues,
} from "@/components/dependents/dependents-filters";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { CompactDateTime } from "@/components/ui/compact-datetime";
import { FileAttachmentList } from "@/components/ui/file-attachment-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { filterDependents } from "@/lib/filters/dependents";
import type { DependentRecordTableRow } from "@/lib/dependents/types";
import { paginate } from "@/lib/pagination";
import { deleteDependentRecordAction } from "@/modules/dependents/actions";

type DependentsTableProps = {
  dependentRecords: DependentRecordTableRow[];
  companyId?: string;
  embedded?: boolean;
};

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

export function DependentsTable({
  dependentRecords,
  companyId,
  embedded = false,
}: DependentsTableProps) {
  const [unreadIds, setUnreadIds] = useState<Set<string> | null>(null);
  const [reviewActive, setReviewActive] = useState(false);
  const [draftFilters, setDraftFilters] = useState<DependentFilterValues>(
    EMPTY_DEPENDENT_FILTERS,
  );
  const [appliedFilters, setAppliedFilters] = useState<DependentFilterValues>(
    EMPTY_DEPENDENT_FILTERS,
  );
  const [page, setPage] = useState(1);

  const visibleRecords = useMemo(() => {
    if (!unreadIds) {
      return dependentRecords;
    }
    return dependentRecords.filter((row) => unreadIds.has(row.id));
  }, [dependentRecords, unreadIds]);

  const filteredRecords = useMemo(
    () => filterDependents(visibleRecords, appliedFilters),
    [appliedFilters, visibleRecords],
  );

  const pagination = useMemo(
    () => paginate(filteredRecords, page),
    [filteredRecords, page],
  );

  useEffect(() => {
    if (page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [page, pagination.totalPages]);

  function handleDraftChange(next: DependentFilterValues) {
    setPage(1);
    setDraftFilters(next);
    setAppliedFilters(next);
  }

  function onSearch() {
    setPage(1);
    setAppliedFilters(draftFilters);
  }

  function onClear() {
    setPage(1);
    setDraftFilters(EMPTY_DEPENDENT_FILTERS);
    setAppliedFilters(EMPTY_DEPENDENT_FILTERS);
  }

  return (
    <Card className="min-w-0">
      <CardHeader
        className={`flex shrink-0 flex-row items-start gap-4 ${embedded ? "justify-end" : "justify-between"}`}
      >
        {embedded ? null : (
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4 text-primary" />
              피부양자 목록
            </CardTitle>
            <CardDescription>등록된 피부양자 정보를 확인하고 관리합니다.</CardDescription>
          </div>
        )}
        <div className="flex shrink-0 items-center gap-2">
          {companyId ? (
            <NewEntriesControls
              companyId={companyId}
              entityTypes={["DEPENDENT_RECORD"]}
              reviewActive={reviewActive}
              onReviewActiveChange={setReviewActive}
              onShowUnreadEntries={(ids) => {
                setPage(1);
                setDraftFilters(EMPTY_DEPENDENT_FILTERS);
                setAppliedFilters(EMPTY_DEPENDENT_FILTERS);
                setUnreadIds(new Set(ids));
              }}
              onClearUnreadFilter={() => setUnreadIds(null)}
            />
          ) : null}
          <DependentFormDialog
            mode="create"
            companyId={companyId}
            disabled={reviewActive}
          />
        </div>
      </CardHeader>
      <CardContent className="min-w-0 space-y-3">
        {dependentRecords.length === 0 ? (
          <EmptyState message="등록된 피부양자 내역이 없습니다. 피부양자 등록 버튼으로 첫 항목을 추가해 주세요." />
        ) : (
          <>
            <fieldset disabled={reviewActive} className="disabled:opacity-60">
              <DependentsFilters
                draft={draftFilters}
                onDraftChange={handleDraftChange}
                onSearch={onSearch}
                onClear={onClear}
                disabled={reviewActive}
              />
            </fieldset>

            {filteredRecords.length === 0 ? (
              <div className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                검색 조건에 맞는 피부양자 내역이 없습니다.
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border">
                <div className="max-w-full min-w-0 overflow-x-auto">
                  <table className="w-max min-w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-left">
                        <th className={stickyNameHeaderClassName}>직원 이름</th>
                        <th className={headerCellClassName}>피부양자 이름</th>
                        <th className={headerCellClassName}>관계</th>
                        <th className={headerCellClassName}>등록 희망일</th>
                        <th className={headerCellClassName}>첨부파일</th>
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
                          <td className={stickyNameCellClassName}>{row.employeeName}</td>
                          <td className={bodyCellClassName}>{row.dependentName}</td>
                          <td className={bodyCellClassName}>{row.relationship}</td>
                          <td className={`${bodyCellClassName} text-muted-foreground`}>
                            {row.registrationRequestedDate}
                          </td>
                          <td className={bodyCellClassName}>
                            <FileAttachmentList
                              attachments={row.attachments}
                              companyId={companyId}
                              disabled={reviewActive}
                            />
                          </td>
                          <td className={bodyCellClassName}>{row.createdByName}</td>
                          <td className={bodyCellClassName}>
                            <CompactDateTime date={new Date(row.createdAt)} />
                          </td>
                          <td className={stickyActionCellClassName}>
                            <div className="flex justify-center gap-2 whitespace-nowrap">
                              <DependentFormDialog
                                mode="edit"
                                companyId={companyId}
                                disabled={reviewActive}
                                dependentRecord={row}
                              />
                              <ConfirmDeleteDialog
                                title="피부양자 정보 삭제"
                                description={`"${row.employeeName}" / "${row.dependentName}" 피부양자 정보를 삭제하시겠습니까? 삭제된 항목은 복구할 수 없습니다.`}
                                action={deleteDependentRecordAction}
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
