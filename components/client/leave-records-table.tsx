"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarOff } from "lucide-react";

import { LeaveRecordFormDialog } from "@/components/client/leave-record-form-dialog";
import {
  MaskedRrnCell,
  MaskedRrnColumnHeader,
  MaskedRrnProvider,
} from "@/components/client/masked-rrn-cell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { NewEntriesControls } from "@/components/layout/new-entries-controls";
import {
  EMPTY_LEAVE_RECORD_FILTERS,
  LeaveRecordsFilters,
  type LeaveRecordFilterValues,
} from "@/components/leave-records/leave-records-filters";
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
import { filterLeaveRecords } from "@/lib/filters/leave-records";
import type { LeaveRecordTableRow } from "@/lib/leave-records/types";
import { paginate } from "@/lib/pagination";
import {
  formatWeeklyHours,
  LEAVE_TYPE_LABELS,
} from "@/modules/leave-records/constants";
import {
  deleteLeaveRecordAction,
  revealLeaveRecordChildRrns,
} from "@/modules/leave-records/actions";

type LeaveRecordsTableProps = {
  leaveRecords: LeaveRecordTableRow[];
  companyId?: string;
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

export function LeaveRecordsTable({
  leaveRecords,
  companyId,
  embedded = false,
}: LeaveRecordsTableProps) {
  const [unreadIds, setUnreadIds] = useState<Set<string> | null>(null);
  const [reviewActive, setReviewActive] = useState(false);
  const [draftFilters, setDraftFilters] = useState<LeaveRecordFilterValues>(
    EMPTY_LEAVE_RECORD_FILTERS,
  );
  const [appliedFilters, setAppliedFilters] = useState<LeaveRecordFilterValues>(
    EMPTY_LEAVE_RECORD_FILTERS,
  );
  const [page, setPage] = useState(1);

  const visibleRecords = useMemo(() => {
    if (!unreadIds) {
      return leaveRecords;
    }
    return leaveRecords.filter((row) => unreadIds.has(row.id));
  }, [leaveRecords, unreadIds]);

  const filteredRecords = useMemo(
    () => filterLeaveRecords(visibleRecords, appliedFilters),
    [appliedFilters, visibleRecords],
  );

  const rrnEntries = useMemo(
    () =>
      filteredRecords
        .filter((row) => row.maskedChildRrn)
        .map((row) => ({ id: row.id })),
    [filteredRecords],
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

  function handleDraftChange(next: LeaveRecordFilterValues) {
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
    setDraftFilters(EMPTY_LEAVE_RECORD_FILTERS);
    setAppliedFilters(EMPTY_LEAVE_RECORD_FILTERS);
  }

  return (
    <Card className="min-w-0">
      <CardHeader
        className={`flex shrink-0 flex-row items-start gap-4 ${embedded ? "justify-end" : "justify-between"}`}
      >
        {embedded ? null : (
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarOff className="size-4 text-primary" />
              휴직자 등 목록
            </CardTitle>
            <CardDescription>등록된 휴직자 등 정보를 확인하고 관리합니다.</CardDescription>
          </div>
        )}
        <div className="flex shrink-0 items-center gap-2">
          {companyId ? (
            <NewEntriesControls
              companyId={companyId}
              entityTypes={["LEAVE_RECORD"]}
              reviewActive={reviewActive}
              onReviewActiveChange={setReviewActive}
              onShowUnreadEntries={(ids) => {
                setPage(1);
                setDraftFilters(EMPTY_LEAVE_RECORD_FILTERS);
                setAppliedFilters(EMPTY_LEAVE_RECORD_FILTERS);
                setUnreadIds(new Set(ids));
              }}
              onClearUnreadFilter={() => setUnreadIds(null)}
            />
          ) : null}
          <LeaveRecordFormDialog
            mode="create"
            companyId={companyId}
            disabled={reviewActive}
          />
        </div>
      </CardHeader>
      <CardContent className="min-w-0 space-y-3">
        {leaveRecords.length === 0 ? (
          <EmptyState message="등록된 휴직자 내역이 없습니다. 휴직자 등록 버튼으로 첫 항목을 추가해 주세요." />
        ) : (
          <>
            <fieldset disabled={reviewActive} className="disabled:opacity-60">
              <LeaveRecordsFilters
                draft={draftFilters}
                onDraftChange={handleDraftChange}
                onSearch={onSearch}
                onClear={onClear}
                disabled={reviewActive}
              />
            </fieldset>

            {filteredRecords.length === 0 ? (
              <div className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                검색 조건에 맞는 휴직자 내역이 없습니다.
              </div>
            ) : (
              <MaskedRrnProvider
                entries={rrnEntries}
                companyId={companyId}
                revealBulkFn={revealLeaveRecordChildRrns}
              >
                <div className="overflow-hidden rounded-lg border">
                  <div className="max-w-full min-w-0 overflow-x-auto">
                    <table className="w-max min-w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/40 text-left">
                          <th rowSpan={2} className={`${stickyNameHeaderClassName} align-middle`}>
                            이름
                          </th>
                          <th rowSpan={2} className={`${headerCellClassName} align-middle`}>
                            종류
                          </th>
                          <th
                            className={`${headerCellClassName} align-middle`}
                            colSpan={2}
                          >
                            기간
                          </th>
                          <th rowSpan={2} className={`${headerCellClassName} align-middle`}>
                            출산(예정)일
                          </th>
                          <th
                            className={`${headerCellClassName} align-middle`}
                            colSpan={2}
                          >
                            대상자녀
                          </th>
                          <th rowSpan={2} className={`${headerCellClassName} align-middle`}>
                            단축 전 근로시간
                          </th>
                          <th rowSpan={2} className={`${headerCellClassName} align-middle`}>
                            단축 후 근로시간
                          </th>
                          <th rowSpan={2} className={`${headerCellClassName} align-middle`}>
                            첨부파일
                          </th>
                          <th rowSpan={2} className={`${headerCellClassName} align-middle`}>
                            등록자
                          </th>
                          <th rowSpan={2} className={`${headerCellClassName} align-middle`}>
                            등록일
                          </th>
                          <th
                            rowSpan={2}
                            className={`${stickyActionHeaderClassName} align-middle`}
                          >
                            관리
                          </th>
                        </tr>
                        <tr className="border-b bg-muted/20 text-left">
                          <th className={headerCellClassName}>시작일</th>
                          <th className={headerCellClassName}>종료일</th>
                          <th className={headerCellClassName}>이름</th>
                          <th className={headerCellClassName}>
                            <MaskedRrnColumnHeader />
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagination.items.map((row) => (
                          <tr
                            key={row.id}
                            className="group border-b last:border-0 hover:bg-muted/20"
                          >
                            <td className={stickyNameCellClassName}>{row.name}</td>
                            <td className={bodyCellClassName}>
                              {LEAVE_TYPE_LABELS[row.leaveType]}
                            </td>
                            <td className={`${bodyCellClassName} text-muted-foreground`}>
                              {row.periodStart}
                            </td>
                            <td className={`${bodyCellClassName} text-muted-foreground`}>
                              {row.periodEnd}
                            </td>
                            <td className={`${bodyCellClassName} text-muted-foreground`}>
                              {displayText(row.expectedDeliveryDate)}
                            </td>
                            <td className={bodyCellClassName}>
                              {displayText(row.childName)}
                            </td>
                            <td className={bodyCellClassName}>
                              {row.maskedChildRrn ? (
                                <MaskedRrnCell
                                  id={row.id}
                                  maskedRrn={row.maskedChildRrn}
                                />
                              ) : (
                                EMPTY_CELL
                              )}
                            </td>
                            <td className={bodyCellClassName}>
                              {formatWeeklyHours(row.hoursBeforeReduction)}
                            </td>
                            <td className={bodyCellClassName}>
                              {formatWeeklyHours(row.hoursAfterReduction)}
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
                                <LeaveRecordFormDialog
                                  mode="edit"
                                  companyId={companyId}
                                  disabled={reviewActive}
                                  leaveRecord={row}
                                />
                                <ConfirmDeleteDialog
                                  title="휴직자 정보 삭제"
                                  description={`"${row.name}" 휴직자 정보를 삭제하시겠습니까? 삭제된 항목은 복구할 수 없습니다.`}
                                  action={deleteLeaveRecordAction}
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
              </MaskedRrnProvider>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
