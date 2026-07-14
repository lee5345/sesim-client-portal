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
import { formatSalaryInput, parseSalaryInput } from "@/lib/format/currency";
import type { SalaryBasis } from "@/lib/generated/prisma/client";
import { getCurrentYearMonth } from "@/lib/daily-workers/period";
import {
  joinRrnSegments,
  RRN_SEGMENT_LENGTHS,
  splitIntoSegments,
} from "@/lib/form/segmented-digits";
import { SALARY_BASES, SALARY_BASIS_LABELS } from "@/modules/hire-intakes/labels";
import {
  createBusinessIncome,
  revealBusinessIncomeRRN,
  updateBusinessIncome,
} from "@/modules/business-income/actions";

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

const textareaClassName =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

type BusinessIncomeFormValues = {
  name: string;
  rrnSegments: string[];
  incomeAmount: string;
  incomeBasis: SalaryBasis;
  notes: string;
};

type BusinessIncomeFormDialogProps = {
  mode: "create" | "edit";
  year: number;
  month: number;
  companyId?: string;
  businessIncome?: {
    id: string;
    name: string;
    incomeAmount: number;
    incomeBasis: SalaryBasis;
    notes: string | null;
  };
};

function createEmptyRrnSegments() {
  return splitIntoSegments("", [...RRN_SEGMENT_LENGTHS]);
}

function getInitialFormValues(
  businessIncome: BusinessIncomeFormDialogProps["businessIncome"],
): BusinessIncomeFormValues {
  return {
    name: businessIncome?.name ?? "",
    rrnSegments: createEmptyRrnSegments(),
    incomeAmount:
      businessIncome?.incomeAmount !== undefined
        ? String(businessIncome.incomeAmount)
        : "",
    incomeBasis: businessIncome?.incomeBasis ?? "GROSS",
    notes: businessIncome?.notes ?? "",
  };
}

function buildFormData(
  values: BusinessIncomeFormValues,
  options: {
    includeRrn: boolean;
    companyId?: string;
  },
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

export function BusinessIncomeFormDialog({
  mode,
  year,
  month,
  companyId,
  businessIncome,
}: BusinessIncomeFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [periodConfirmOpen, setPeriodConfirmOpen] = useState(false);
  const [formValues, setFormValues] = useState<BusinessIncomeFormValues>(() =>
    getInitialFormValues(businessIncome),
  );
  const [rrnEditing, setRrnEditing] = useState(mode === "create");
  const [revealedRrn, setRevealedRrn] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isEdit = mode === "edit";
  const formId = `${mode}-${businessIncome?.id ?? "new"}-${year}-${month}`;
  const rrnRequired = !isEdit || rrnEditing;
  const isNonCurrentPeriod = useMemo(() => {
    if (isEdit) return false;
    const current = getCurrentYearMonth();
    return year !== current.year || month !== current.month;
  }, [isEdit, year, month]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setFormValues(getInitialFormValues(businessIncome));
    setRrnEditing(mode === "create");
    setRevealedRrn(null);
    setFormError(null);
  }, [open, businessIncome, mode]);

  function updateFormValue<K extends keyof BusinessIncomeFormValues>(
    key: K,
    value: BusinessIncomeFormValues[K],
  ) {
    setFormValues((current) => ({ ...current, [key]: value }));
  }

  function resetState() {
    setFormValues(getInitialFormValues(businessIncome));
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
          aria-label="사업소득 정보 수정"
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
          사업소득 등록
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
              현재 시기가 아닌 {year}년 {month}월에 사업소득을 등록하려고 합니다.
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
        <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "사업소득 정보 수정" : "사업소득 등록"}
            </DialogTitle>
            <DialogDescription>
              {year}년 {month}월 사업소득 정보를 {isEdit ? "수정" : "등록"}합니다.
            </DialogDescription>
          </DialogHeader>
          <form
            className="flex min-h-0 flex-1 flex-col gap-4"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              setFormError(null);

              startTransition(async () => {
                const formData = buildFormData(formValues, {
                  includeRrn: !isEdit || rrnEditing,
                  companyId,
                });
                const result =
                  isEdit && businessIncome
                    ? await updateBusinessIncome(businessIncome.id, {
                        year,
                        month,
                        formData,
                      })
                    : await createBusinessIncome({
                        year,
                        month,
                        formData,
                      });

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
                        if (!businessIncome) {
                          return;
                        }
                        startTransition(async () => {
                          const result = await revealBusinessIncomeRRN(
                            businessIncome.id,
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
                        if (!businessIncome) {
                          return;
                        }
                        startTransition(async () => {
                          const result = await revealBusinessIncomeRRN(
                            businessIncome.id,
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
                  <FieldLabel htmlFor={`incomeBasis-${formId}`} required>
                    기준
                  </FieldLabel>
                  <select
                    id={`incomeBasis-${formId}`}
                    value={formValues.incomeBasis}
                    onChange={(event) =>
                      updateFormValue(
                        "incomeBasis",
                        event.target.value as SalaryBasis,
                      )
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
                  <FieldLabel htmlFor={`incomeAmount-${formId}`} required>
                    소득액
                  </FieldLabel>
                  <Input
                    id={`incomeAmount-${formId}`}
                    inputMode="numeric"
                    value={formatSalaryInput(formValues.incomeAmount)}
                    onChange={(event) =>
                      updateFormValue(
                        "incomeAmount",
                        parseSalaryInput(event.target.value),
                      )
                    }
                    required
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor={`notes-${formId}`}>비고</FieldLabel>
                <textarea
                  id={`notes-${formId}`}
                  value={formValues.notes}
                  onChange={(event) => updateFormValue("notes", event.target.value)}
                  className={textareaClassName}
                  rows={3}
                  maxLength={500}
                  disabled={isPending}
                />
              </div>
            </div>
            <DialogFooter className="shrink-0">
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => setOpen(false)}
              >
                취소
              </Button>
              <Button type="submit" disabled={isPending}>
                {isEdit ? "저장" : "등록"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
