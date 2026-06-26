"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Eye, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";

import { SegmentedDigitFields } from "@/components/client/segmented-digit-fields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FieldLabel } from "@/components/ui/field-label";
import {
  calculateAvgHoursPerDay,
  calculateDaysWorked,
  createEmptyDailyHours,
  formatDailyHourDayLabel,
  formatDailyHoursInput,
  getDailyHourDayNumbers,
  isValidDailyHoursInput,
  parseDailyHoursInput,
  serializeDailyHoursValue,
  type DailyHoursInput,
} from "@/lib/daily-workers/calculations";
import { formatSalaryInput, parseSalaryInput } from "@/lib/format/currency";
import type { DailyWorkerOccupation, SalaryBasis } from "@/lib/generated/prisma/client";
import { getCurrentYearMonth } from "@/lib/daily-workers/period";
import {
  joinRrnSegments,
  RRN_SEGMENT_LENGTHS,
  splitIntoSegments,
} from "@/lib/form/segmented-digits";
import { SALARY_BASES, SALARY_BASIS_LABELS } from "@/modules/hire-intakes/labels";
import {
  createDailyWorker,
  revealDailyWorkerRRN,
  updateDailyWorker,
} from "@/modules/daily-workers/actions";
import {
  DAILY_HOUR_FIELD_NAMES,
  DAILY_WORKER_OCCUPATIONS,
  type DailyHourFieldName,
} from "@/modules/daily-workers/constants";

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

const dayInputClassName =
  "h-7 w-full min-w-0 rounded-md border border-input bg-transparent px-1 text-center text-xs font-mono outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

const textareaClassName =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

const HOURS_ERROR_MESSAGE =
  "근로시간은 0~24 사이에서 소수점 첫째 자리까지만 입력할 수 있습니다.";

type DailyWorkerFormValues = {
  name: string;
  rrnSegments: string[];
  occupation: DailyWorkerOccupation | "";
  salaryBasis: SalaryBasis;
  totalWage: string;
  hours: DailyHoursInput;
  notes: string;
};

type DailyWorkerFormDialogProps = {
  mode: "create" | "edit";
  year: number;
  month: number;
  companyId?: string;
  dailyWorker?: {
    id: string;
    name: string;
    occupation: DailyWorkerOccupation;
    salaryBasis: SalaryBasis;
    totalWage: number;
    hours: DailyHoursInput;
    notes: string | null;
  };
};

function createEmptyRrnSegments() {
  return splitIntoSegments("", [...RRN_SEGMENT_LENGTHS]);
}

function getInitialFormValues(
  dailyWorker: DailyWorkerFormDialogProps["dailyWorker"],
): DailyWorkerFormValues {
  return {
    name: dailyWorker?.name ?? "",
    rrnSegments: createEmptyRrnSegments(),
    occupation: dailyWorker?.occupation ?? "",
    salaryBasis: dailyWorker?.salaryBasis ?? "GROSS",
    totalWage:
      dailyWorker?.totalWage !== undefined
        ? String(dailyWorker.totalWage)
        : "",
    hours: dailyWorker?.hours ?? createEmptyDailyHours(),
    notes: dailyWorker?.notes ?? "",
  };
}

function buildFormData(
  values: DailyWorkerFormValues,
  options: {
    includeRrn: boolean;
    companyId?: string;
    year: number;
    month: number;
  },
): FormData {
  const formData = new FormData();

  if (options.companyId) {
    formData.set("companyId", options.companyId);
  }

  formData.set("year", String(options.year));
  formData.set("month", String(options.month));
  formData.set("name", values.name);
  formData.set("occupation", values.occupation);
  formData.set("salaryBasis", values.salaryBasis);
  formData.set("totalWage", values.totalWage);
  formData.set("notes", values.notes);

  for (const fieldName of DAILY_HOUR_FIELD_NAMES) {
    const value = values.hours[fieldName];
    if (value !== null) {
      formData.set(fieldName, serializeDailyHoursValue(value));
    }
  }

  if (options.includeRrn) {
    formData.set(
      "rrn",
      joinRrnSegments(values.rrnSegments[0] ?? "", values.rrnSegments[1] ?? ""),
    );
  }

  return formData;
}

function resolveHoursForSubmit(
  hours: DailyHoursInput,
  hourDrafts: Partial<Record<DailyHourFieldName, string>>,
): DailyHoursInput | { error: string } {
  const resolved = { ...hours };

  for (const fieldName of DAILY_HOUR_FIELD_NAMES) {
    const draft = hourDrafts[fieldName];
    if (draft === undefined) {
      continue;
    }

    const trimmed = draft.trim();
    if (!trimmed) {
      resolved[fieldName] = null;
      continue;
    }

    if (!isValidDailyHoursInput(trimmed)) {
      return {
        error: "근로시간은 소수점 첫째 자리까지만 입력할 수 있습니다.",
      };
    }

    resolved[fieldName] = parseDailyHoursInput(trimmed);
  }

  return resolved;
}

export function DailyWorkerFormDialog({
  mode,
  year,
  month,
  companyId,
  dailyWorker,
}: DailyWorkerFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [periodConfirmOpen, setPeriodConfirmOpen] = useState(false);
  const [formValues, setFormValues] = useState<DailyWorkerFormValues>(() =>
    getInitialFormValues(dailyWorker),
  );
  const [hourDrafts, setHourDrafts] = useState<
    Partial<Record<DailyHourFieldName, string>>
  >({});
  const [rrnEditing, setRrnEditing] = useState(mode === "create");
  const [revealedRrn, setRevealedRrn] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isEdit = mode === "edit";
  const formId = `${mode}-${dailyWorker?.id ?? "new"}-${year}-${month}`;
  const rrnRequired = !isEdit || rrnEditing;
  const dayNumbers = useMemo(() => getDailyHourDayNumbers(), []);
  const isNonCurrentPeriod = useMemo(() => {
    if (isEdit) return false;
    const current = getCurrentYearMonth();
    return year !== current.year || month !== current.month;
  }, [isEdit, year, month]);

  const previewDaysWorked = useMemo(
    () => calculateDaysWorked(formValues.hours),
    [formValues.hours],
  );
  const previewAvgHours = useMemo(
    () => calculateAvgHoursPerDay(formValues.hours),
    [formValues.hours],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setFormValues(getInitialFormValues(dailyWorker));
    setHourDrafts({});
    setRrnEditing(mode === "create");
    setRevealedRrn(null);
    setFormError(null);
  }, [open, dailyWorker, mode]);

  function updateFormValue<K extends keyof DailyWorkerFormValues>(
    key: K,
    value: DailyWorkerFormValues[K],
  ) {
    setFormValues((current) => ({ ...current, [key]: value }));
  }

  function updateHourValue(day: number, rawValue: string) {
    const fieldName = `hoursDay${day}` as const;
    if (rawValue !== "" && !/^\d{0,2}(\.\d?)?$/.test(rawValue)) {
      return;
    }

    if (formError === HOURS_ERROR_MESSAGE) {
      const trimmed = rawValue.trim();
      if (trimmed === "" || isValidDailyHoursInput(trimmed)) {
        setFormError(null);
      }
    }

    setHourDrafts((current) => ({ ...current, [fieldName]: rawValue }));
  }

  function getHourInputValue(day: number): string {
    const fieldName = `hoursDay${day}` as const;
    if (Object.hasOwn(hourDrafts, fieldName)) {
      return hourDrafts[fieldName] ?? "";
    }

    return formatDailyHoursInput(formValues.hours[fieldName]);
  }

  function commitHourValue(day: number) {
    const fieldName = `hoursDay${day}` as const;
    if (!Object.hasOwn(hourDrafts, fieldName)) {
      return;
    }

    const raw = hourDrafts[fieldName] ?? "";
    const trimmed = raw.trim();
    if (trimmed !== "" && !isValidDailyHoursInput(trimmed)) {
      setFormError(HOURS_ERROR_MESSAGE);
      return;
    }

    const parsed = trimmed === "" ? null : parseDailyHoursInput(trimmed);

    setFormValues((current) => ({
      ...current,
      hours: {
        ...current.hours,
        [fieldName]: parsed,
      },
    }));
    if (formError === HOURS_ERROR_MESSAGE) {
      setFormError(null);
    }
    setHourDrafts((current) => {
      const next = { ...current };
      delete next[fieldName];
      return next;
    });
  }

  function resetState() {
    setFormValues(getInitialFormValues(dailyWorker));
    setHourDrafts({});
    setRrnEditing(mode === "create");
    setRevealedRrn(null);
    setFormError(null);
  }

  function startRrnEditing(rrn?: string) {
    setRrnEditing(true);
    if (rrn) {
      setFormValues((current) => ({
        ...current,
        rrnSegments: splitIntoSegments(rrn, [...RRN_SEGMENT_LENGTHS]),
      }));
    }
  }

  return (
    <>
      {isEdit ? (
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="일용직 정보 수정"
          onClick={() => setOpen(true)}
        >
          <Pencil className="size-4" />
        </Button>
      ) : (
        <Button
          type="button"
          onClick={() => {
            if (isNonCurrentPeriod) {
              setPeriodConfirmOpen(true);
              return;
            }
            setOpen(true);
          }}
        >
          일용직 등록
        </Button>
      )}

      <Dialog
        open={periodConfirmOpen}
        onOpenChange={(nextOpen) => setPeriodConfirmOpen(nextOpen)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>선택한 시기를 확인해 주세요</DialogTitle>
            <DialogDescription>
              현재 시기가 아닌 {year}년 {month}월에 일용직을 등록하려고 합니다.
              계속 진행하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPeriodConfirmOpen(false)}
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={() => {
                setPeriodConfirmOpen(false);
                setOpen(true);
              }}
            >
              계속
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            resetState();
          }
        }}
      >
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "일용직 정보 수정" : "일용직 등록"}</DialogTitle>
          <DialogDescription>
            {year}년 {month}월 일용직 정보를 {isEdit ? "수정" : "등록"}합니다.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex min-h-0 flex-1 flex-col gap-4"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            setFormError(null);

            const resolvedHours = resolveHoursForSubmit(formValues.hours, hourDrafts);
            if ("error" in resolvedHours) {
              setFormError(resolvedHours.error);
              return;
            }

            startTransition(async () => {
              const formData = buildFormData(
                { ...formValues, hours: resolvedHours },
                {
                includeRrn: !isEdit || rrnEditing,
                companyId,
                year,
                month,
              });
              const result =
                isEdit && dailyWorker
                  ? await updateDailyWorker(dailyWorker.id, formData)
                  : await createDailyWorker(formData);

              if (!result.success) {
                setFormError(result.error);
                return;
              }

              setOpen(false);
              resetState();
              router.refresh();
            });
          }}
        >
          {formError ? (
            <p className="shrink-0 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          ) : null}
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel htmlFor={`name-${formId}`} required>
                  이름
                </FieldLabel>
                <Input
                  id={`name-${formId}`}
                  value={formValues.name}
                  onChange={(event) => updateFormValue("name", event.target.value)}
                  required
                  maxLength={100}
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor={`occupation-${formId}`} required>
                  직종
                </FieldLabel>
                <select
                  id={`occupation-${formId}`}
                  value={formValues.occupation}
                  onChange={(event) =>
                    updateFormValue(
                      "occupation",
                      event.target.value as DailyWorkerOccupation,
                    )
                  }
                  className={selectClassName}
                  required
                  disabled={isPending}
                >
                  <option value="">선택</option>
                  {DAILY_WORKER_OCCUPATIONS.map((occupation) => (
                    <option key={occupation.value} value={occupation.value}>
                      {occupation.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <FieldLabel required={rrnRequired}>주민등록번호</FieldLabel>
              {isEdit && !rrnEditing ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm text-muted-foreground">
                    {revealedRrn ?? "******-*******"}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => {
                      if (!dailyWorker) {
                        return;
                      }
                      startTransition(async () => {
                        const result = await revealDailyWorkerRRN(
                          dailyWorker.id,
                          companyId,
                        );
                        setRevealedRrn(result.rrn);
                      });
                    }}
                  >
                    <Eye className="size-4" />
                    확인
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => {
                      if (revealedRrn) {
                        startRrnEditing(revealedRrn);
                        return;
                      }
                      if (!dailyWorker) {
                        return;
                      }
                      startTransition(async () => {
                        const result = await revealDailyWorkerRRN(
                          dailyWorker.id,
                          companyId,
                        );
                        setRevealedRrn(result.rrn);
                        startRrnEditing(result.rrn);
                      });
                    }}
                  >
                    변경
                  </Button>
                </div>
              ) : (
                <SegmentedDigitFields
                  idPrefix={`rrn-${formId}`}
                  segmentLengths={RRN_SEGMENT_LENGTHS}
                  values={formValues.rrnSegments}
                  onChange={(rrnSegments) =>
                    updateFormValue("rrnSegments", rrnSegments)
                  }
                  disabled={isPending}
                />
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel htmlFor={`salaryBasis-${formId}`} required>
                  기준
                </FieldLabel>
                <select
                  id={`salaryBasis-${formId}`}
                  value={formValues.salaryBasis}
                  onChange={(event) =>
                    updateFormValue("salaryBasis", event.target.value as SalaryBasis)
                  }
                  className={selectClassName}
                  required
                  disabled={isPending}
                >
                  {SALARY_BASES.map((basis) => (
                    <option key={basis} value={basis}>
                      {SALARY_BASIS_LABELS[basis]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor={`totalWage-${formId}`} required>
                  임금총액
                </FieldLabel>
                <Input
                  id={`totalWage-${formId}`}
                  inputMode="numeric"
                  value={formatSalaryInput(formValues.totalWage)}
                  onChange={(event) =>
                    updateFormValue("totalWage", parseSalaryInput(event.target.value))
                  }
                  required
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <FieldLabel>일별 근로시간</FieldLabel>
                <p className="text-xs text-muted-foreground">
                  근로일수 {previewDaysWorked}일 · 일평균 {previewAvgHours}시간
                </p>
              </div>
              <div className="grid grid-cols-10 gap-1 rounded-lg border bg-muted/20 p-2 sm:grid-cols-12">
                {dayNumbers.map((day) => {
                  const fieldName = `hoursDay${day}` as const;
                  return (
                    <div key={day} className="space-y-1">
                      <label
                        htmlFor={`${fieldName}-${formId}`}
                        className="block text-center text-[10px] text-muted-foreground"
                      >
                        {formatDailyHourDayLabel(day)}
                      </label>
                      <input
                        id={`${fieldName}-${formId}`}
                        type="text"
                        inputMode="decimal"
                        className={dayInputClassName}
                        value={getHourInputValue(day)}
                        placeholder="—"
                        disabled={isPending}
                        onChange={(event) => updateHourValue(day, event.target.value)}
                        onBlur={() => commitHourValue(day)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor={`notes-${formId}`}>비고</FieldLabel>
              <textarea
                id={`notes-${formId}`}
                value={formValues.notes}
                onChange={(event) => updateFormValue("notes", event.target.value)}
                disabled={isPending}
                maxLength={500}
                rows={3}
                className={textareaClassName}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              취소
            </Button>
            <Button type="submit" disabled={isPending}>
              저장
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      </Dialog>
    </>
  );
}
