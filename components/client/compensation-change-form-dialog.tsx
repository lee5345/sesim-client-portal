"use client";

import { useEffect, useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  createCompensationChange,
  updateCompensationChange,
} from "@/modules/compensation-changes/actions";
import {
  SALARY_BASES,
  SALARY_BASIS_LABELS,
  SALARY_TYPE_LABELS,
  SALARY_TYPES,
} from "@/modules/hire-intakes/labels";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FieldLabel } from "@/components/ui/field-label";
import { Input } from "@/components/ui/input";
import { formatSalaryInput, parseSalaryInput } from "@/lib/format/currency";
import type { SalaryBasis, SalaryType } from "@/lib/generated/prisma/client";

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

const textareaClassName =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

type CompensationChangeFormValues = {
  name: string;
  changeDate: string;
  salaryTypeBefore: SalaryType;
  salaryBasisBefore: SalaryBasis;
  salaryAmountBefore: string;
  salaryTypeAfter: SalaryType;
  salaryBasisAfter: SalaryBasis;
  salaryAmountAfter: string;
  notes: string;
};

type CompensationChangeFormDialogProps = {
  mode: "create" | "edit";
  companyId?: string;
  disabled?: boolean;
  compensationChange?: {
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
  };
};

function getInitialFormValues(
  record: CompensationChangeFormDialogProps["compensationChange"],
): CompensationChangeFormValues {
  return {
    name: record?.name ?? "",
    changeDate: record?.changeDate ?? "",
    salaryTypeBefore: record?.salaryTypeBefore ?? "MONTHLY",
    salaryBasisBefore: record?.salaryBasisBefore ?? "GROSS",
    salaryAmountBefore:
      record?.salaryAmountBefore !== undefined ? String(record.salaryAmountBefore) : "",
    salaryTypeAfter: record?.salaryTypeAfter ?? "MONTHLY",
    salaryBasisAfter: record?.salaryBasisAfter ?? "GROSS",
    salaryAmountAfter:
      record?.salaryAmountAfter !== undefined ? String(record.salaryAmountAfter) : "",
    notes: record?.notes ?? "",
  };
}

function buildFormData(
  values: CompensationChangeFormValues,
  options: { companyId?: string },
): FormData {
  const formData = new FormData();

  if (options.companyId) {
    formData.set("companyId", options.companyId);
  }

  formData.set("name", values.name);
  formData.set("changeDate", values.changeDate);
  formData.set("salaryTypeBefore", values.salaryTypeBefore);
  formData.set("salaryBasisBefore", values.salaryBasisBefore);
  formData.set("salaryAmountBefore", values.salaryAmountBefore);
  formData.set("salaryTypeAfter", values.salaryTypeAfter);
  formData.set("salaryBasisAfter", values.salaryBasisAfter);
  formData.set("salaryAmountAfter", values.salaryAmountAfter);
  formData.set("notes", values.notes);

  return formData;
}

export function CompensationChangeFormDialog({
  mode,
  companyId,
  disabled = false,
  compensationChange,
}: CompensationChangeFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formValues, setFormValues] = useState<CompensationChangeFormValues>(() =>
    getInitialFormValues(compensationChange),
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isEdit = mode === "edit";
  const formId = `${mode}-${compensationChange?.id ?? "new"}`;

  useEffect(() => {
    if (!open) {
      return;
    }
    setFormValues(getInitialFormValues(compensationChange));
    setFormError(null);
  }, [open, compensationChange]);

  function updateFormValue<K extends keyof CompensationChangeFormValues>(
    key: K,
    value: CompensationChangeFormValues[K],
  ) {
    setFormValues((current) => ({ ...current, [key]: value }));
  }

  function resetState() {
    setFormValues(getInitialFormValues(compensationChange));
    setFormError(null);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          resetState();
        }
      }}
    >
      <DialogTrigger
        disabled={disabled}
        render={
          isEdit ? (
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="급여변경 정보 수정"
              disabled={disabled}
            >
              <Pencil className="size-4" />
            </Button>
          ) : (
            <Button type="button" disabled={disabled}>
              급여변경 등록
            </Button>
          )
        }
      />
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "급여변경 정보 수정" : "급여변경 등록"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "급여변경 정보를 수정합니다." : "급여변경 정보를 등록합니다."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex min-h-0 flex-1 flex-col gap-4"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            setFormError(null);

            startTransition(async () => {
              const formData = buildFormData(formValues, { companyId });
              const result =
                isEdit && compensationChange
                  ? await updateCompensationChange(compensationChange.id, formData)
                  : await createCompensationChange(formData);

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
                <FieldLabel htmlFor={`changeDate-${formId}`} required>
                  급여변경일
                </FieldLabel>
                <DateInput
                  id={`changeDate-${formId}`}
                  value={formValues.changeDate}
                  onChange={(value) => updateFormValue("changeDate", value)}
                  required
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
              <p className="text-sm font-medium sm:col-span-2">변경 전 급여</p>

              <div className="space-y-2">
                <FieldLabel htmlFor={`salaryTypeBefore-${formId}`} required>
                  급여 유형
                </FieldLabel>
                <select
                  id={`salaryTypeBefore-${formId}`}
                  value={formValues.salaryTypeBefore}
                  onChange={(event) =>
                    updateFormValue("salaryTypeBefore", event.target.value as SalaryType)
                  }
                  className={selectClassName}
                  required
                  disabled={isPending}
                >
                  {SALARY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {SALARY_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor={`salaryBasisBefore-${formId}`} required>
                  급여 기준
                </FieldLabel>
                <select
                  id={`salaryBasisBefore-${formId}`}
                  value={formValues.salaryBasisBefore}
                  onChange={(event) =>
                    updateFormValue("salaryBasisBefore", event.target.value as SalaryBasis)
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

              <div className="space-y-2 sm:col-span-2">
                <FieldLabel htmlFor={`salaryAmountBefore-${formId}`} required>
                  금액
                </FieldLabel>
                <Input
                  id={`salaryAmountBefore-${formId}`}
                  type="text"
                  inputMode="numeric"
                  value={formatSalaryInput(formValues.salaryAmountBefore)}
                  onChange={(event) =>
                    updateFormValue(
                      "salaryAmountBefore",
                      parseSalaryInput(event.target.value),
                    )
                  }
                  required
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
              <p className="text-sm font-medium sm:col-span-2">변경 후 급여</p>

              <div className="space-y-2">
                <FieldLabel htmlFor={`salaryTypeAfter-${formId}`} required>
                  급여 유형
                </FieldLabel>
                <select
                  id={`salaryTypeAfter-${formId}`}
                  value={formValues.salaryTypeAfter}
                  onChange={(event) =>
                    updateFormValue("salaryTypeAfter", event.target.value as SalaryType)
                  }
                  className={selectClassName}
                  required
                  disabled={isPending}
                >
                  {SALARY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {SALARY_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor={`salaryBasisAfter-${formId}`} required>
                  급여 기준
                </FieldLabel>
                <select
                  id={`salaryBasisAfter-${formId}`}
                  value={formValues.salaryBasisAfter}
                  onChange={(event) =>
                    updateFormValue("salaryBasisAfter", event.target.value as SalaryBasis)
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

              <div className="space-y-2 sm:col-span-2">
                <FieldLabel htmlFor={`salaryAmountAfter-${formId}`} required>
                  금액
                </FieldLabel>
                <Input
                  id={`salaryAmountAfter-${formId}`}
                  type="text"
                  inputMode="numeric"
                  value={formatSalaryInput(formValues.salaryAmountAfter)}
                  onChange={(event) =>
                    updateFormValue("salaryAmountAfter", parseSalaryInput(event.target.value))
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
  );
}

