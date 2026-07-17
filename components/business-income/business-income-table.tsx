"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Copy,
  Pencil,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { NAV_ICONS } from "@/components/layout/nav-icons";

const BusinessIncomeIcon = NAV_ICONS["dollar-sign"];

import { BusinessIncomeMonthSelector } from "@/components/business-income/business-income-month-selector";
import {
  MaskedRrnCell,
  MaskedRrnColumnHeader,
  MaskedRrnProvider,
} from "@/components/client/masked-rrn-cell";
import { SegmentedDigitFields } from "@/components/client/segmented-digit-fields";
import { ExcelExportDialog } from "@/components/export/excel-export-dialog";
import { EmptyState } from "@/components/dashboard/empty-state";
import { NewEntriesControls } from "@/components/layout/new-entries-controls";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { CompactDateTime } from "@/components/ui/compact-datetime";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { BusinessIncomeTableRow } from "@/lib/business-income/types";
import { summarizeBusinessIncomeFilters } from "@/lib/export/filter-summaries";
import { filterBusinessIncomes } from "@/lib/filters/business-income";
import { formatSalaryAmount, formatSalaryInput, parseSalaryInput } from "@/lib/format/currency";
import {
  joinRrnSegments,
  RRN_SEGMENT_LENGTHS,
  splitIntoSegments,
} from "@/lib/form/segmented-digits";
import type { SalaryBasis } from "@/lib/generated/prisma/client";
import { paginate } from "@/lib/pagination";
import { listUnreadTenantChangeEntityIdsAction } from "@/lib/realtime/sync-actions";
import {
  copyBusinessIncomeNamesFromMostRecentMonth,
  createBusinessIncome,
  deleteBusinessIncomeAction,
  revealBusinessIncomeRRN,
  revealBusinessIncomeRrns,
  updateBusinessIncome,
} from "@/modules/business-income/actions";
import { exportBusinessIncomesExcel } from "@/modules/business-income/export";
import { SALARY_BASES, SALARY_BASIS_LABELS } from "@/modules/hire-intakes/labels";

function clearShowUnreadParam(
  basePath: string,
  searchParams: URLSearchParams,
): string {
  const params = new URLSearchParams(searchParams.toString());
  params.delete("showUnread");
  return `${basePath}?${params.toString()}`;
}

const selectClassName =
  "h-8 w-24 min-w-0 rounded-lg border border-input bg-transparent px-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

const textareaClassName =
  "h-8 w-full min-w-0 resize-none rounded-lg border border-input bg-transparent px-2 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

const headerCellClassName =
  "border-r border-border/30 px-4 py-3 text-left font-medium whitespace-nowrap last:border-r-0";
const bodyCellClassName =
  "border-r border-border/30 px-4 py-3 align-middle whitespace-nowrap last:border-r-0";
const stickyNameHeaderClassName =
  "sticky left-0 z-40 border-r border-border bg-muted px-4 py-3 text-left font-medium whitespace-nowrap shadow-[10px_0_20px_-10px_rgba(0,0,0,0.15)]";
const stickyNameCellClassName =
  "sticky left-0 z-30 border-r border-border bg-muted px-4 py-3 align-middle whitespace-nowrap shadow-[10px_0_20px_-10px_rgba(0,0,0,0.12)] group-hover:bg-muted";
const stickyActionHeaderClassName =
  "sticky right-0 z-30 border-l border-border bg-muted px-4 py-3 text-center font-medium whitespace-nowrap shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.15)]";
const stickyActionCellClassName =
  "sticky right-0 z-20 border-l border-border bg-muted px-4 py-3 text-center align-middle whitespace-nowrap shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.12)] group-hover:bg-muted";

type RowFormValues = {
  name: string;
  rrnSegments: string[];
  incomeAmount: string;
  incomeBasis: SalaryBasis;
  notes: string;
};

type BusinessIncomeTableProps = {
  businessIncomes: BusinessIncomeTableRow[];
  year: number;
  month: number;
  companyId?: string;
  companyName?: string;
  basePath?: string;
};

function createEmptyRrnSegments() {
  return splitIntoSegments("", [...RRN_SEGMENT_LENGTHS]);
}

function createEmptyFormValues(): RowFormValues {
  return {
    name: "",
    rrnSegments: createEmptyRrnSegments(),
    incomeAmount: "",
    incomeBasis: "GROSS",
    notes: "",
  };
}

function rowToFormValues(row: BusinessIncomeTableRow): RowFormValues {
  return {
    name: row.name,
    rrnSegments: createEmptyRrnSegments(),
    incomeAmount: String(row.incomeAmount),
    incomeBasis: row.incomeBasis,
    notes: row.notes ?? "",
  };
}

function buildFormData(
  values: RowFormValues,
  options: { companyId?: string; includeRrn: boolean },
): FormData {
  const formData = new FormData();

  if (options.companyId) {
    formData.set("companyId", options.companyId);
  }

  formData.set("name", values.name);
  formData.set("incomeAmount", values.incomeAmount);
  formData.set("incomeBasis", values.incomeBasis);
  formData.set("notes", values.notes);

  if (options.includeRrn) {
    formData.set(
      "rrn",
      joinRrnSegments(values.rrnSegments[0] ?? "", values.rrnSegments[1] ?? ""),
    );
  }

  return formData;
}

export function BusinessIncomeTable({
  businessIncomes,
  year,
  month,
  companyId,
  companyName,
  basePath = "/client/business-income",
}: BusinessIncomeTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showUnread = searchParams.get("showUnread") === "1";
  const [isPending, startTransition] = useTransition();
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<RowFormValues>(createEmptyFormValues);
  const [formError, setFormError] = useState<string | null>(null);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [copyModeDialogOpen, setCopyModeDialogOpen] = useState(false);
  const [unreadIds, setUnreadIds] = useState<Set<string> | null>(null);
  const [reviewActive, setReviewActive] = useState(false);
  const [draftNameFilter, setDraftNameFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [page, setPage] = useState(1);

  const chromeLocked = isPending || editingRowId !== null || reviewActive;

  function showUnreadEntriesForPeriod(ids: string[]) {
    setUnreadIds(new Set(ids));
    setDraftNameFilter("");
    setNameFilter("");
    setPage(1);
  }

  useEffect(() => {
    if (!companyId || !showUnread) {
      return;
    }

    router.replace(
      clearShowUnreadParam(basePath, new URLSearchParams(searchParams.toString())),
      { scroll: false },
    );

    void (async () => {
      const ids = await listUnreadTenantChangeEntityIdsAction({
        companyId,
        entityTypes: ["BUSINESS_INCOME"],
        periodYear: year,
        periodMonth: month,
      });
      showUnreadEntriesForPeriod(ids);
      setReviewActive(true);
    })();
  }, [basePath, companyId, month, router, searchParams, showUnread, year]);

  const visibleRows = useMemo(() => {
    if (!unreadIds) {
      return businessIncomes;
    }
    return businessIncomes.filter((row) => unreadIds.has(row.id));
  }, [businessIncomes, unreadIds]);

  const filteredRows = useMemo(
    () => filterBusinessIncomes(visibleRows, { name: nameFilter }),
    [nameFilter, visibleRows],
  );

  const filterSummary = useMemo(
    () => summarizeBusinessIncomeFilters(year, month, { name: nameFilter }),
    [year, month, nameFilter],
  );

  const defaultTitle = `${year}년 ${month}월 사업소득 정보`;

  function applyFilters() {
    setPage(1);
    setNameFilter(draftNameFilter);
  }

  function clearFilters() {
    setPage(1);
    setDraftNameFilter("");
    setNameFilter("");
  }

  const pagination = useMemo(() => paginate(filteredRows, page), [filteredRows, page]);

  useEffect(() => {
    if (page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [page, pagination.totalPages]);

  type TableRow =
    | { id: string; isDraft: true }
    | (BusinessIncomeTableRow & { isDraft: false });

  const tableRows = useMemo((): TableRow[] => {
    const pageRows = pagination.items.map((row) => ({ ...row, isDraft: false as const }));
    if (editingRowId?.startsWith("draft-")) {
      return [{ id: editingRowId, isDraft: true }, ...pageRows];
    }
    return pageRows;
  }, [editingRowId, pagination.items]);

  function updateFormValue<K extends keyof RowFormValues>(
    key: K,
    value: RowFormValues[K],
  ) {
    setFormValues((current) => ({ ...current, [key]: value }));
  }

  function startEdit(row: BusinessIncomeTableRow) {
    setEditingRowId(row.id);
    setFormValues(rowToFormValues(row));
    setFormError(null);

    if (!companyId) {
      setFormError("주민등록번호를 불러오지 못했습니다.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await revealBusinessIncomeRRN(row.id, companyId);
        setFormValues((current) => ({
          ...current,
          rrnSegments: splitIntoSegments(result.rrn, [...RRN_SEGMENT_LENGTHS]),
        }));
      } catch {
        setFormError("주민등록번호를 불러오지 못했습니다.");
      }
    });
  }

  function startDraft() {
    const draftId = `draft-${crypto.randomUUID()}`;
    setEditingRowId(draftId);
    setFormValues(createEmptyFormValues());
    setFormError(null);
  }

  function cancelEdit() {
    setEditingRowId(null);
    setFormValues(createEmptyFormValues());
    setFormError(null);
  }

  function saveEdit() {
    if (!editingRowId) {
      return;
    }

    setFormError(null);
    const isDraft = editingRowId.startsWith("draft-");

    startTransition(async () => {
      const formData = buildFormData(formValues, {
        companyId,
        includeRrn: true,
      });
      const result = isDraft
        ? await createBusinessIncome({ year, month, formData })
        : await updateBusinessIncome(editingRowId, { year, month, formData });

      if (!result.success) {
        setFormError(result.error);
        return;
      }

      cancelEdit();
      router.refresh();
    });
  }

  function handleCopyClick() {
    if (businessIncomes.length > 0) {
      setCopyModeDialogOpen(true);
      return;
    }
    setCopyDialogOpen(true);
  }

  function runCopy(mode: "overwrite" | "append") {
    if (!companyId) {
      return;
    }

    startTransition(async () => {
      await copyBusinessIncomeNamesFromMostRecentMonth({
        companyId,
        year,
        month,
        mode,
      });
      setCopyDialogOpen(false);
      setCopyModeDialogOpen(false);
      router.refresh();
    });
  }

  return (
    <Card className="min-w-0">
      <CardHeader className="flex shrink-0 flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <BusinessIncomeIcon className="size-4 text-primary" />
            사업소득 목록
          </CardTitle>
          <CardDescription>
            {year}년 {month}월로 등록된 사업소득 정보를 확인하고 관리합니다.
          </CardDescription>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {companyId ? (
            <NewEntriesControls
              companyId={companyId}
              entityTypes={["BUSINESS_INCOME"]}
              periodScope={{ year, month, basePath }}
              reviewActive={reviewActive}
              onReviewActiveChange={setReviewActive}
              onShowUnreadEntries={showUnreadEntriesForPeriod}
              onClearUnreadFilter={() => setUnreadIds(null)}
            />
          ) : null}
          <ExcelExportDialog
            moduleLabel="사업소득 정보"
            defaultTitle={defaultTitle}
            companyName={companyName}
            filterSummary={filterSummary}
            entryCount={filteredRows.length}
            disabled={chromeLocked}
            companyId={companyId}
            onExport={({ title }) =>
              exportBusinessIncomesExcel({
                title,
                year,
                month,
                filters: { name: nameFilter },
                companyId,
              })
            }
          />
          <Button
            type="button"
            disabled={chromeLocked}
            onClick={startDraft}
          >
            <Plus className="size-4" />
            인원 추가
          </Button>
        </div>
      </CardHeader>
      <CardContent className="min-w-0 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <BusinessIncomeMonthSelector
            year={year}
            month={month}
            basePath={basePath}
            disabled={chromeLocked}
          />
          <Button
            type="button"
            variant="outline"
            className="h-8 shrink-0 self-end"
            disabled={chromeLocked || !companyId}
            onClick={handleCopyClick}
          >
            <Copy className="size-4" />
            최근 인원 복사
          </Button>
        </div>

        {businessIncomes.length > 0 ? (
          <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
              <div className="min-w-0 flex-1 space-y-1.5">
                <Label htmlFor="business-income-name-filter">이름</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="business-income-name-filter"
                    value={draftNameFilter}
                    placeholder="이름으로 검색"
                    className="pl-8"
                    disabled={chromeLocked}
                    onChange={(event) => {
                      const name = event.target.value;
                      setPage(1);
                      setDraftNameFilter(name);
                      setNameFilter(name);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        applyFilters();
                      }
                    }}
                  />
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 lg:ml-auto">
                <Button
                  type="button"
                  disabled={chromeLocked}
                  onClick={applyFilters}
                >
                  <Search className="size-4" />
                  검색
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={chromeLocked}
                  onClick={clearFilters}
                >
                  <X className="size-4" />
                  필터 초기화
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {formError ? (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {formError}
          </p>
        ) : null}

        {filteredRows.length === 0 && !editingRowId ? (
          businessIncomes.length === 0 ? (
            <EmptyState message="등록된 사업소득 정보가 없습니다. 인원 추가 버튼으로 첫 항목을 추가하거나 최근 월 인원을 복사해 주세요." />
          ) : (
            <div className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
              검색 조건에 맞는 사업소득 정보가 없습니다.
            </div>
          )
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <MaskedRrnProvider
              entries={pagination.items.map((row) => ({ id: row.id }))}
              companyId={companyId}
              revealBulkFn={revealBusinessIncomeRrns}
            >
              <div className="max-h-[60vh] max-w-full min-w-0 overflow-auto">
                <table className="w-max min-w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left">
                      <th className={stickyNameHeaderClassName}>이름</th>
                      <th className={headerCellClassName}>
                        {editingRowId ? (
                          <span className="whitespace-nowrap">주민등록번호</span>
                        ) : (
                          <MaskedRrnColumnHeader />
                        )}
                      </th>
                      <th className={headerCellClassName}>소득액</th>
                      <th className={headerCellClassName}>비고</th>
                      <th className={headerCellClassName}>등록자</th>
                      <th className={headerCellClassName}>등록일</th>
                      <th className={stickyActionHeaderClassName}>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((row) => {
                      const isEditing = editingRowId === row.id;
                      const isDraft = row.isDraft;

                      return (
                        <tr
                          key={row.id}
                          className="group border-b last:border-0 hover:bg-muted/20"
                        >
                          <td className={stickyNameCellClassName}>
                            {isEditing ? (
                              <Input
                                value={formValues.name}
                                onChange={(event) =>
                                  updateFormValue("name", event.target.value)
                                }
                                disabled={isPending}
                                maxLength={100}
                                className="h-8 w-28"
                              />
                            ) : isDraft ? (
                              "—"
                            ) : (
                              row.name
                            )}
                          </td>
                          <td className={bodyCellClassName}>
                            {isEditing ? (
                              <SegmentedDigitFields
                                idPrefix={`rrn-${row.id}`}
                                segmentLengths={RRN_SEGMENT_LENGTHS}
                                values={formValues.rrnSegments}
                                onChange={(rrnSegments) =>
                                  updateFormValue("rrnSegments", rrnSegments)
                                }
                                disabled={isPending}
                              />
                            ) : isDraft ? (
                              "—"
                            ) : (
                              <MaskedRrnCell
                                id={row.id}
                                maskedRrn={row.maskedRrn}
                              />
                            )}
                          </td>
                          <td className={`${bodyCellClassName} w-px`}>
                            {isEditing ? (
                              <div className="flex w-full items-center justify-between gap-2">
                                <select
                                  className={selectClassName}
                                  value={formValues.incomeBasis}
                                  onChange={(event) =>
                                    updateFormValue(
                                      "incomeBasis",
                                      event.target.value as SalaryBasis,
                                    )
                                  }
                                  disabled={isPending}
                                >
                                  {SALARY_BASES.map((basis) => (
                                    <option key={basis} value={basis}>
                                      {SALARY_BASIS_LABELS[basis]}
                                    </option>
                                  ))}
                                </select>
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  className="h-8 w-28 px-2 text-right"
                                  value={formatSalaryInput(formValues.incomeAmount)}
                                  onChange={(event) =>
                                    updateFormValue(
                                      "incomeAmount",
                                      parseSalaryInput(event.target.value),
                                    )
                                  }
                                  disabled={isPending}
                                />
                              </div>
                            ) : isDraft ? (
                              "—"
                            ) : (
                              <div className="flex w-full min-w-28 items-center justify-between gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {SALARY_BASIS_LABELS[row.incomeBasis]}
                                </span>
                                <span className="tabular-nums text-muted-foreground">
                                  {formatSalaryAmount(row.incomeAmount)}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className={bodyCellClassName}>
                            {isEditing ? (
                              <textarea
                                value={formValues.notes}
                                onChange={(event) =>
                                  updateFormValue("notes", event.target.value)
                                }
                                disabled={isPending}
                                maxLength={500}
                                rows={1}
                                className={textareaClassName}
                              />
                            ) : isDraft ? (
                              "—"
                            ) : (
                              <span className="block max-w-48 truncate text-muted-foreground">
                                {row.notes?.trim() ? row.notes : "—"}
                              </span>
                            )}
                          </td>
                          <td className={`${bodyCellClassName} text-muted-foreground`}>
                            {isDraft ? "—" : row.createdByName}
                          </td>
                          <td className={`${bodyCellClassName} text-muted-foreground`}>
                            {isDraft ? (
                              "—"
                            ) : (
                              <CompactDateTime date={row.createdAt} />
                            )}
                          </td>
                          <td className={stickyActionCellClassName}>
                            <div className="flex justify-center gap-1 whitespace-nowrap">
                              {isEditing ? (
                                <>
                                  <Button
                                    type="button"
                                    size="sm"
                                    disabled={isPending}
                                    onClick={saveEdit}
                                  >
                                    저장
                                  </Button>
                                  <Button
                                    type="button"
                                    size="icon-sm"
                                    variant="outline"
                                    disabled={isPending}
                                    aria-label="취소"
                                    onClick={cancelEdit}
                                  >
                                    <X className="size-4" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon-sm"
                                    disabled={chromeLocked}
                                    aria-label="수정"
                                    onClick={() => {
                                      if (!row.isDraft) {
                                        startEdit(row);
                                      }
                                    }}
                                  >
                                    <Pencil className="size-4" />
                                  </Button>
                                  {!row.isDraft ? (
                                    <ConfirmDeleteDialog
                                      title="사업소득 정보 삭제"
                                      description={`"${row.name}" 사업소득 정보를 삭제하시겠습니까? 삭제된 항목은 복구할 수 없습니다.`}
                                      action={deleteBusinessIncomeAction}
                                      hiddenFields={{
                                        id: row.id,
                                        ...(companyId ? { companyId } : {}),
                                      }}
                                      triggerLabel="삭제"
                                      disabled={chromeLocked}
                                    />
                                  ) : null}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </MaskedRrnProvider>
            <DataTablePagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              rangeStart={pagination.rangeStart}
              rangeEnd={pagination.rangeEnd}
              total={pagination.total}
              disabled={chromeLocked}
              onPageChange={setPage}
            />
          </div>
        )}
      </CardContent>

      <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>최근 인원 복사</DialogTitle>
            <DialogDescription>
              가장 최근에 기록이 있는 월의 인원 목록을 {year}년 {month}월로
              복사합니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCopyDialogOpen(false)}
              disabled={isPending}
            >
              취소
            </Button>
            <Button
              type="button"
              disabled={isPending}
              onClick={() => runCopy("append")}
            >
              복사
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={copyModeDialogOpen} onOpenChange={setCopyModeDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>복사 방식 선택</DialogTitle>
            <DialogDescription>
              {year}년 {month}월에 이미 등록된 항목이 있습니다. 덮어쓰기는 기존
              항목을 삭제한 뒤 이름·주민번호만 복사하고, 추가하기는 기존 인원을
              유지한 채 새 인원만 추가합니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCopyModeDialogOpen(false)}
              disabled={isPending}
            >
              취소
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => runCopy("append")}
            >
              추가하기
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={() => runCopy("overwrite")}
            >
              덮어쓰기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
