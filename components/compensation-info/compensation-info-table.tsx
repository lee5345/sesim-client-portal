"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Calculator, Copy, Pencil, Plus, Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { CompensationInfoMonthSelector } from "@/components/compensation-info/compensation-info-month-selector";
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
import {
  formatDecimalHours,
  formatUnusedLeaveAmount,
  splitDecimalHours,
} from "@/lib/compensation-info/format";
import { summarizeCompensationInfoFilters } from "@/lib/export/filter-summaries";
import { filterCompensationInfos } from "@/lib/filters/compensation-info";
import { formatSalaryAmount, formatSalaryInput, parseSalaryInput } from "@/lib/format/currency";
import type { SalaryBasis } from "@/lib/generated/prisma/client";
import type { UnusedLeaveUnit } from "@/lib/generated/prisma/client";
import {
  copyCompensationInfoNamesFromMostRecentMonth,
  createCompensationInfo,
  deleteCompensationInfoAction,
  updateCompensationInfo,
} from "@/modules/compensation-info/actions";
import { exportCompensationInfosExcel } from "@/modules/compensation-info/export";
import { paginate } from "@/lib/pagination";
import { listUnreadTenantChangeEntityIdsAction } from "@/lib/realtime/sync-actions";

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

export type CompensationInfoTableRow = {
  id: string;
  name: string;
  overtimeHours: number | null;
  holidayHours: number | null;
  nightHours: number | null;
  absenceDays: number | null;
  lateEarlyLeaveHours: number | null;
  incentiveAmount: number | null;
  incentiveBasis: SalaryBasis | null;
  unusedLeaveUnit: UnusedLeaveUnit | null;
  unusedLeaveAmount: number | null;
  notes: string | null;
  createdAt: string;
  createdByName: string;
};

type RowFormValues = {
  name: string;
  overtimeHoursHours: string;
  overtimeHoursMinutes: string;
  holidayHoursHours: string;
  holidayHoursMinutes: string;
  nightHoursHours: string;
  nightHoursMinutes: string;
  absenceDays: string;
  lateEarlyLeaveHoursHours: string;
  lateEarlyLeaveHoursMinutes: string;
  incentiveAmount: string;
  incentiveBasis: SalaryBasis | "";
  unusedLeaveUnit: UnusedLeaveUnit | "";
  unusedLeaveAmount: string;
  notes: string;
};

type CompensationInfoTableProps = {
  compensationInfos: CompensationInfoTableRow[];
  year: number;
  month: number;
  companyId?: string;
  companyName?: string;
  basePath?: string;
  embedded?: boolean;
};

function createEmptyFormValues(): RowFormValues {
  return {
    name: "",
    overtimeHoursHours: "",
    overtimeHoursMinutes: "",
    holidayHoursHours: "",
    holidayHoursMinutes: "",
    nightHoursHours: "",
    nightHoursMinutes: "",
    absenceDays: "",
    lateEarlyLeaveHoursHours: "",
    lateEarlyLeaveHoursMinutes: "",
    incentiveAmount: "",
    incentiveBasis: "",
    unusedLeaveUnit: "",
    unusedLeaveAmount: "",
    notes: "",
  };
}

function rowToFormValues(row: CompensationInfoTableRow): RowFormValues {
  const overtime = splitDecimalHours(row.overtimeHours);
  const holiday = splitDecimalHours(row.holidayHours);
  const night = splitDecimalHours(row.nightHours);
  const late = splitDecimalHours(row.lateEarlyLeaveHours);

  return {
    name: row.name,
    overtimeHoursHours: overtime.hours,
    overtimeHoursMinutes: overtime.minutes,
    holidayHoursHours: holiday.hours,
    holidayHoursMinutes: holiday.minutes,
    nightHoursHours: night.hours,
    nightHoursMinutes: night.minutes,
    absenceDays: row.absenceDays !== null ? String(row.absenceDays) : "",
    lateEarlyLeaveHoursHours: late.hours,
    lateEarlyLeaveHoursMinutes: late.minutes,
    incentiveAmount:
      row.incentiveAmount !== null ? String(row.incentiveAmount) : "",
    incentiveBasis: row.incentiveBasis ?? "",
    unusedLeaveUnit: row.unusedLeaveUnit ?? "",
    unusedLeaveAmount:
      row.unusedLeaveAmount !== null ? String(row.unusedLeaveAmount) : "",
    notes: row.notes ?? "",
  };
}

function buildFormData(
  values: RowFormValues,
  options: { companyId?: string },
): FormData {
  const formData = new FormData();

  if (options.companyId) {
    formData.set("companyId", options.companyId);
  }

  formData.set("name", values.name);
  formData.set("overtimeHoursHours", values.overtimeHoursHours);
  formData.set("overtimeHoursMinutes", values.overtimeHoursMinutes);
  formData.set("holidayHoursHours", values.holidayHoursHours);
  formData.set("holidayHoursMinutes", values.holidayHoursMinutes);
  formData.set("nightHoursHours", values.nightHoursHours);
  formData.set("nightHoursMinutes", values.nightHoursMinutes);
  formData.set("absenceDays", values.absenceDays);
  formData.set("lateEarlyLeaveHoursHours", values.lateEarlyLeaveHoursHours);
  formData.set("lateEarlyLeaveHoursMinutes", values.lateEarlyLeaveHoursMinutes);
  formData.set("incentiveAmount", values.incentiveAmount);
  formData.set("incentiveBasis", values.incentiveBasis);
  formData.set("unusedLeaveUnit", values.unusedLeaveUnit);
  formData.set("unusedLeaveAmount", values.unusedLeaveAmount);
  formData.set("notes", values.notes);

  return formData;
}

function HourPartsInput({
  idPrefix,
  hours,
  minutes,
  onHoursChange,
  onMinutesChange,
  disabled,
}: {
  idPrefix: string;
  hours: string;
  minutes: string;
  onHoursChange: (value: string) => void;
  onMinutesChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <Input
        id={`${idPrefix}-hours`}
        type="text"
        inputMode="numeric"
        className="h-8 w-10 px-1 text-center"
        value={hours}
        onChange={(event) =>
          onHoursChange(event.target.value.replace(/\D/g, "").slice(0, 3))
        }
        disabled={disabled}
        placeholder="0"
      />
      <span className="text-xs text-muted-foreground">시간</span>
      <Input
        id={`${idPrefix}-minutes`}
        type="text"
        inputMode="numeric"
        className="h-8 w-10 px-1 text-center"
        value={minutes}
        onChange={(event) => {
          const raw = event.target.value.replace(/\D/g, "").slice(0, 2);
          if (!raw) {
            onMinutesChange("");
            return;
          }
          const parsed = Number(raw);
          if (!Number.isFinite(parsed)) {
            onMinutesChange("");
            return;
          }
          onMinutesChange(String(Math.min(59, Math.max(0, parsed))));
        }}
        disabled={disabled}
        placeholder="0"
      />
      <span className="text-xs text-muted-foreground">분</span>
    </div>
  );
}

function validateMinuteParts(values: RowFormValues): string | null {
  const minuteKeys: (keyof RowFormValues)[] = [
    "overtimeHoursMinutes",
    "holidayHoursMinutes",
    "nightHoursMinutes",
    "lateEarlyLeaveHoursMinutes",
  ];

  for (const key of minuteKeys) {
    const raw = values[key].trim();
    if (!raw) continue;
    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 59) {
      return "분 입력은 0~59 사이여야 합니다.";
    }
  }

  return null;
}

export function CompensationInfoTable({
  compensationInfos,
  year,
  month,
  companyId,
  companyName,
  basePath = "/client/compensation-info",
  embedded = false,
}: CompensationInfoTableProps) {
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

  function showUnreadEntriesForPeriod(ids: string[]) {
    setUnreadIds(new Set(ids));
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
        entityTypes: ["COMPENSATION_INFO"],
        periodYear: year,
        periodMonth: month,
      });
      showUnreadEntriesForPeriod(ids);
      setReviewActive(true);
    })();
  }, [basePath, companyId, month, router, searchParams, showUnread, year]);

  const visibleRows = useMemo(() => {
    if (!unreadIds) {
      return compensationInfos;
    }
    return compensationInfos.filter((row) => unreadIds.has(row.id));
  }, [compensationInfos, unreadIds]);

  const filteredRows = useMemo(
    () => filterCompensationInfos(visibleRows, { name: nameFilter }),
    [nameFilter, visibleRows],
  );

  const filterSummary = useMemo(
    () => summarizeCompensationInfoFilters(year, month, { name: nameFilter }),
    [year, month, nameFilter],
  );

  const defaultTitle = `${year}년 ${month}월 상세급여 정보`;

  const hasAnyNotes = useMemo(
    () => compensationInfos.some((row) => Boolean(row.notes?.trim())),
    [compensationInfos],
  );

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
  | (CompensationInfoTableRow & { isDraft: false });

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

  function startEdit(row: CompensationInfoTableRow) {
    setEditingRowId(row.id);
    setFormValues(rowToFormValues(row));
    setFormError(null);
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

    const minuteError = validateMinuteParts(formValues);
    if (minuteError) {
      setFormError(minuteError);
      return;
    }

    startTransition(async () => {
      const formData = buildFormData(formValues, { companyId });
      const isDraft = editingRowId.startsWith("draft-");
      const result = isDraft
        ? await createCompensationInfo({ year, month, formData })
        : await updateCompensationInfo({
            id: editingRowId,
            year,
            month,
            formData,
          });

      if (!result.success) {
        setFormError(result.error);
        return;
      }

      setEditingRowId(null);
      setFormValues(createEmptyFormValues());
      router.refresh();
    });
  }

  function handleCopyClick() {
    if (compensationInfos.length > 0) {
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
      await copyCompensationInfoNamesFromMostRecentMonth({
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

  function renderHourCell(value: number | null, fieldPrefix: string, isEditing: boolean) {
    if (!isEditing) {
      const formatted = formatDecimalHours(value);
      return (
        <span className="font-medium text-muted-foreground">
          {formatted === "—" ? "—" : `${formatted}시간`}
        </span>
      );
    }

    const hoursKey = `${fieldPrefix}Hours` as keyof RowFormValues;
    const minutesKey = `${fieldPrefix}Minutes` as keyof RowFormValues;

    return (
      <HourPartsInput
        idPrefix={fieldPrefix}
        hours={formValues[hoursKey]}
        minutes={formValues[minutesKey]}
        onHoursChange={(next) => updateFormValue(hoursKey, next)}
        onMinutesChange={(next) => updateFormValue(minutesKey, next)}
        disabled={isPending}
      />
    );
  }

  return (
    <Card className="min-w-0">
      <CardHeader
        className={`flex shrink-0 flex-row items-start gap-4 ${embedded ? "justify-end" : "justify-between"}`}
      >
        {embedded ? null : (
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calculator className="size-4 text-primary" />
              상세급여 목록
            </CardTitle>
            <CardDescription>
              {year}년 {month}월 재직자 상세급여 정보를 관리합니다.
            </CardDescription>
          </div>
        )}
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {companyId ? (
            <NewEntriesControls
              companyId={companyId}
              entityTypes={["COMPENSATION_INFO"]}
              periodScope={{ year, month, basePath }}
              reviewActive={reviewActive}
              onReviewActiveChange={setReviewActive}
              onShowUnreadEntries={showUnreadEntriesForPeriod}
              onClearUnreadFilter={() => setUnreadIds(null)}
            />
          ) : null}
          <ExcelExportDialog
            moduleLabel="상세급여 정보"
            defaultTitle={defaultTitle}
            companyName={companyName}
            filterSummary={filterSummary}
            entryCount={filteredRows.length}
            disabled={isPending || editingRowId !== null}
            companyId={companyId}
            onExport={({ title }) =>
              exportCompensationInfosExcel({
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
            disabled={isPending || editingRowId !== null}
            onClick={startDraft}
          >
            <Plus className="size-4" />
            재직자 추가
          </Button>
        </div>
      </CardHeader>
      <CardContent className="min-w-0 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <CompensationInfoMonthSelector year={year} month={month} basePath={basePath} />
          <Button
            type="button"
            variant="outline"
            className="h-8 shrink-0 self-end"
            disabled={isPending || editingRowId !== null}
            onClick={handleCopyClick}
          >
            <Copy className="size-4" />
            최근 인원 복사
          </Button>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="min-w-0 flex-1 space-y-1.5">
              <Label htmlFor="compensation-info-name-filter">이름</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="compensation-info-name-filter"
                  value={draftNameFilter}
                  placeholder="이름으로 검색"
                  className="pl-8"
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
              <Button type="button" onClick={applyFilters}>
                <Search className="size-4" />
                검색
              </Button>
              <Button type="button" variant="outline" onClick={clearFilters}>
                <X className="size-4" />
                필터 초기화
              </Button>
            </div>
          </div>
        </div>

        {formError ? (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {formError}
          </p>
        ) : null}

        {filteredRows.length === 0 && !editingRowId ? (
          compensationInfos.length === 0 ? (
            <EmptyState message="등록된 상세급여 정보가 없습니다. 재직자 추가 버튼으로 첫 항목을 추가하거나 최근 월 인원을 복사해 주세요." />
          ) : (
            <div className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
              검색 조건에 맞는 상세급여 정보가 없습니다.
            </div>
          )
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <div className="max-h-[60vh] max-w-full min-w-0 overflow-auto">
              <table className="w-max min-w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th rowSpan={2} className={`${stickyNameHeaderClassName} align-middle`}>
                    이름
                  </th>
                  <th rowSpan={2} className={`${headerCellClassName} align-middle`}>
                    연장근로
                  </th>
                  <th rowSpan={2} className={`${headerCellClassName} align-middle`}>
                    휴일근로
                  </th>
                  <th rowSpan={2} className={`${headerCellClassName} align-middle`}>
                    야간근로
                  </th>
                  <th className={`${headerCellClassName} text-center`} colSpan={2}>
                    근태공제
                  </th>
                  <th rowSpan={2} className={`${headerCellClassName} align-middle`}>
                    인센티브
                  </th>
                  <th className={`${headerCellClassName} text-center`} colSpan={2}>
                    미사용연차
                  </th>
                  <th
                    rowSpan={2}
                    className={`${headerCellClassName} align-middle${hasAnyNotes ? " min-w-52" : ""}`}
                  >
                    비고
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
                  <th className={headerCellClassName}>결근</th>
                  <th className={headerCellClassName}>지각 및 조퇴</th>
                  <th className={headerCellClassName}>단위</th>
                  <th className={headerCellClassName}>값</th>
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
                        {renderHourCell(
                          isDraft ? null : row.overtimeHours,
                          "overtimeHours",
                          isEditing,
                        )}
                      </td>
                      <td className={bodyCellClassName}>
                        {renderHourCell(
                          isDraft ? null : row.holidayHours,
                          "holidayHours",
                          isEditing,
                        )}
                      </td>
                      <td className={bodyCellClassName}>
                        {renderHourCell(
                          isDraft ? null : row.nightHours,
                          "nightHours",
                          isEditing,
                        )}
                      </td>
                      <td className={bodyCellClassName}>
                        {isEditing ? (
                          <Input
                            type="text"
                            inputMode="numeric"
                            className="h-8 w-10 px-1 text-center"
                            value={formValues.absenceDays}
                            onChange={(event) =>
                              updateFormValue(
                                "absenceDays",
                                event.target.value.replace(/\D/g, "").slice(0, 2),
                              )
                            }
                            disabled={isPending}
                          />
                        ) : isDraft ? (
                          "—"
                        ) : row.absenceDays !== null ? (
                          <span className="font-medium text-muted-foreground">
                            {row.absenceDays}일
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className={bodyCellClassName}>
                        {renderHourCell(
                          isDraft ? null : row.lateEarlyLeaveHours,
                          "lateEarlyLeaveHours",
                          isEditing,
                        )}
                      </td>
                      <td className={bodyCellClassName}>
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <select
                              className={selectClassName}
                              value={formValues.incentiveBasis}
                              onChange={(event) =>
                                updateFormValue(
                                  "incentiveBasis",
                                  event.target.value as SalaryBasis | "",
                                )
                              }
                              disabled={isPending}
                            >
                              <option value="">선택</option>
                              <option value="GROSS">세전</option>
                              <option value="NET">세후</option>
                            </select>
                            <Input
                              type="text"
                              inputMode="numeric"
                              className="h-8 w-24 px-2 text-right"
                              value={formatSalaryInput(formValues.incentiveAmount)}
                              onChange={(event) =>
                                updateFormValue(
                                  "incentiveAmount",
                                  parseSalaryInput(event.target.value),
                                )
                              }
                              disabled={isPending}
                            />
                          </div>
                        ) : isDraft ? (
                          "—"
                        ) : row.incentiveAmount !== null ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-muted-foreground">
                              {row.incentiveBasis === "NET"
                                ? "세후"
                                : row.incentiveBasis === "GROSS"
                                  ? "세전"
                                  : "—"}
                            </span>
                            <span className="text-muted-foreground">
                              {formatSalaryAmount(row.incentiveAmount)}
                            </span>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className={bodyCellClassName}>
                        {isEditing ? (
                          <select
                            className={selectClassName}
                            value={formValues.unusedLeaveUnit}
                            onChange={(event) =>
                              updateFormValue(
                                "unusedLeaveUnit",
                                event.target.value as UnusedLeaveUnit | "",
                              )
                            }
                            disabled={isPending}
                          >
                            <option value="">선택</option>
                            <option value="DAYS">일수</option>
                            <option value="HOURS">시간</option>
                          </select>
                        ) : isDraft ? (
                          "—"
                        ) : row.unusedLeaveUnit === "DAYS" ? (
                          <span className="text-muted-foreground">일수</span>
                        ) : row.unusedLeaveUnit === "HOURS" ? (
                          <span className="text-muted-foreground">시간</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className={bodyCellClassName}>
                        {isEditing ? (
                          <Input
                            type="text"
                            inputMode="decimal"
                            className="h-8 w-20"
                            value={formValues.unusedLeaveAmount}
                            onChange={(event) =>
                              updateFormValue("unusedLeaveAmount", event.target.value)
                            }
                            disabled={isPending}
                          />
                        ) : isDraft ? (
                          "—"
                        ) : (
                          <span className="text-muted-foreground">
                            {formatUnusedLeaveAmount(
                              row.unusedLeaveUnit,
                              row.unusedLeaveAmount,
                            )}
                          </span>
                        )}
                      </td>
                      <td
                        className={`${bodyCellClassName}${hasAnyNotes ? " min-w-52" : ""} whitespace-normal break-all align-middle`}
                      >
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
                          <span className="block whitespace-pre-wrap break-all text-muted-foreground">
                            {row.notes?.trim() ? row.notes : "—"}
                          </span>
                        )}
                      </td>
                      <td className={bodyCellClassName}>
                        {isDraft ? "—" : row.createdByName}
                      </td>
                      <td className={bodyCellClassName}>
                        {isDraft ? (
                          "—"
                        ) : (
                          <CompactDateTime date={new Date(row.createdAt)} />
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
                                disabled={isPending || editingRowId !== null}
                                aria-label="수정"
                                onClick={() => {
                                  if (!row.isDraft) {
                                    startEdit(row);
                                  }
                                }}
                              >
                                <Pencil className="size-4" />
                              </Button>
                              {!isDraft ? (
                                <ConfirmDeleteDialog
                                  title="상세급여 정보 삭제"
                                  description={`"${row.name}" 상세급여 정보를 삭제하시겠습니까? 삭제된 항목은 복구할 수 없습니다.`}
                                  action={deleteCompensationInfoAction}
                                  hiddenFields={{
                                    id: row.id,
                                    ...(companyId ? { companyId } : {}),
                                  }}
                                  triggerLabel="삭제"
                                  triggerSize="sm"
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
      </CardContent>

      <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>최근 인원 복사</DialogTitle>
            <DialogDescription>
              가장 최근에 기록이 있는 월의 재직자 목록을 {year}년 {month}월로
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
              항목을 삭제한 뒤 이름만 복사하고, 추가하기는 기존 재직자을 유지한 채
              새 재직자만 추가합니다.
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
