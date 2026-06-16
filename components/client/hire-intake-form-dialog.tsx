"use client";

import { useEffect, useState, useTransition } from "react";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  createHireIntake,
  revealRRN,
  updateHireIntake,
} from "@/modules/hire-intakes/actions";
import {
  BANK_CUSTOM_VALUE,
  KOREAN_BANKS,
  NON_TAXABLE_ALLOWANCE_TYPES,
  type NonTaxableAllowanceType,
} from "@/modules/hire-intakes/constants";
import {
  SALARY_BASES,
  SALARY_BASIS_LABELS,
  SALARY_TYPE_LABELS,
  SALARY_TYPES,
} from "@/modules/hire-intakes/labels";
import { SegmentedDigitFields } from "@/components/client/segmented-digit-fields";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  joinRrnSegments,
  RRN_SEGMENT_LENGTHS,
  splitIntoSegments,
} from "@/lib/form/segmented-digits";
import { formatSalaryInput, parseSalaryInput } from "@/lib/format/currency";
import { formatPhone, parsePhoneInput } from "@/lib/format/phone";
import type { NonTaxableAllowance } from "@/lib/validation/hire-intake";
import type { SalaryBasis, SalaryType } from "@/lib/generated/prisma/client";

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

const textareaClassName =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

type DepartmentOption = {
  id: string;
  name: string;
};

type NonTaxableAllowanceFormRow = {
  id: string;
  type: NonTaxableAllowanceType | "";
  customLabel: string;
  amount: string;
};

type HireIntakeFormValues = {
  name: string;
  email: string;
  rrnSegments: string[];
  hireDate: string;
  department: string;
  salaryType: SalaryType;
  salaryBasis: SalaryBasis;
  salaryAmount: string;
  isContract: string;
  contractStart: string;
  contractEnd: string;
  nonTaxableAllowances: NonTaxableAllowanceFormRow[];
  bankPreset: string;
  bankNameCustom: string;
  accountNumber: string;
  phone: string;
  notes: string;
};

type HireIntakeFormDialogProps = {
  mode: "create" | "edit";
  departments: DepartmentOption[];
  companyId?: string;
  hireIntake?: {
    id: string;
    name: string;
    email: string;
    hireDate: string;
    department: string | null;
    salaryType: SalaryType;
    salaryBasis: SalaryBasis;
    salaryAmount: number;
    isContract: boolean;
    contractStart: string | null;
    contractEnd: string | null;
    nonTaxableAllowances: NonTaxableAllowance[] | null;
    bankName: string | null;
    accountNumber: string | null;
    phone: string | null;
    notes: string | null;
  };
};

function toDateInputValue(date: string | null | undefined) {
  return date ?? "";
}

function createEmptyRrnSegments() {
  return splitIntoSegments("", [...RRN_SEGMENT_LENGTHS]);
}

function createAllowanceRow(
  overrides?: Partial<NonTaxableAllowanceFormRow>,
): NonTaxableAllowanceFormRow {
  return {
    id: crypto.randomUUID(),
    type: "",
    customLabel: "",
    amount: "",
    ...overrides,
  };
}

function parseStoredAllowances(value: unknown): NonTaxableAllowanceFormRow[] {
  if (!Array.isArray(value) || value.length === 0) {
    return [];
  }

  return value.map((item) => {
    const row = item as NonTaxableAllowance;
    return createAllowanceRow({
      type: NON_TAXABLE_ALLOWANCE_TYPES.includes(row.type) ? row.type : "",
      customLabel: row.customLabel ?? "",
      amount: String(row.amount),
    });
  });
}

function getBankPreset(bankName: string | null | undefined) {
  if (!bankName) {
    return "";
  }
  if ((KOREAN_BANKS as readonly string[]).includes(bankName)) {
    return bankName;
  }
  return BANK_CUSTOM_VALUE;
}

function getInitialFormValues(
  hireIntake: HireIntakeFormDialogProps["hireIntake"],
): HireIntakeFormValues {
  const bankPreset = getBankPreset(hireIntake?.bankName);
  return {
    name: hireIntake?.name ?? "",
    email: hireIntake?.email ?? "",
    rrnSegments: createEmptyRrnSegments(),
    hireDate: toDateInputValue(hireIntake?.hireDate),
    department: hireIntake?.department ?? "",
    salaryType: hireIntake?.salaryType ?? "MONTHLY",
    salaryBasis: hireIntake?.salaryBasis ?? "GROSS",
    salaryAmount:
      hireIntake?.salaryAmount !== undefined
        ? String(hireIntake.salaryAmount)
        : "",
    isContract: hireIntake?.isContract ? "true" : "false",
    contractStart: toDateInputValue(hireIntake?.contractStart),
    contractEnd: toDateInputValue(hireIntake?.contractEnd),
    nonTaxableAllowances: parseStoredAllowances(hireIntake?.nonTaxableAllowances),
    bankPreset,
    bankNameCustom:
      bankPreset === BANK_CUSTOM_VALUE ? (hireIntake?.bankName ?? "") : "",
    accountNumber: hireIntake?.accountNumber ?? "",
    phone: hireIntake?.phone ?? "",
    notes: hireIntake?.notes ?? "",
  };
}

function serializeNonTaxableAllowances(rows: NonTaxableAllowanceFormRow[]) {
  const items = rows
    .filter((row) => row.type && row.amount)
    .map((row) => ({
      type: row.type,
      ...(row.type === "기타" ? { customLabel: row.customLabel } : {}),
      amount: Number(parseSalaryInput(row.amount)),
    }));

  return JSON.stringify(items);
}

function resolveBankName(values: HireIntakeFormValues) {
  if (!values.bankPreset) {
    return "";
  }
  if (values.bankPreset === BANK_CUSTOM_VALUE) {
    return values.bankNameCustom.trim();
  }
  return values.bankPreset;
}

function buildFormData(
  values: HireIntakeFormValues,
  options: { includeRrn: boolean; companyId?: string },
): FormData {
  const formData = new FormData();

  if (options.companyId) {
    formData.set("companyId", options.companyId);
  }

  formData.set("name", values.name);
  formData.set("email", values.email);
  formData.set("hireDate", values.hireDate);
  formData.set("department", values.department);
  formData.set("salaryType", values.salaryType);
  formData.set("salaryBasis", values.salaryBasis);
  formData.set("salaryAmount", values.salaryAmount);
  formData.set("isContract", values.isContract);
  formData.set("contractStart", values.contractStart);
  formData.set("contractEnd", values.contractEnd);
  formData.set("nonTaxableAllowances", serializeNonTaxableAllowances(values.nonTaxableAllowances));
  formData.set("bankName", resolveBankName(values));
  formData.set("accountNumber", values.accountNumber.replace(/\D/g, ""));
  formData.set("phone", values.phone);
  formData.set("notes", values.notes);

  if (options.includeRrn) {
    formData.set(
      "rrn",
      joinRrnSegments(values.rrnSegments[0] ?? "", values.rrnSegments[1] ?? ""),
    );
  }

  return formData;
}

export function HireIntakeFormDialog({
  mode,
  departments,
  companyId,
  hireIntake,
}: HireIntakeFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formValues, setFormValues] = useState<HireIntakeFormValues>(() =>
    getInitialFormValues(hireIntake),
  );
  const [rrnEditing, setRrnEditing] = useState(mode === "create");
  const [revealedRrn, setRevealedRrn] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isEdit = mode === "edit";
  const formId = `${mode}-${hireIntake?.id ?? "new"}`;
  const isContract = formValues.isContract === "true";

  useEffect(() => {
    if (!open) {
      return;
    }

    setFormValues(getInitialFormValues(hireIntake));
    setRrnEditing(mode === "create");
    setRevealedRrn(null);
    setFormError(null);
  }, [open, hireIntake, mode]);

  function updateFormValue<K extends keyof HireIntakeFormValues>(
    key: K,
    value: HireIntakeFormValues[K],
  ) {
    setFormValues((current) => ({ ...current, [key]: value }));
  }

  function resetState() {
    setFormValues(getInitialFormValues(hireIntake));
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
        render={
          isEdit ? (
            <Button variant="outline" size="icon-sm" aria-label="입사자 정보 수정">
              <Pencil className="size-4" />
            </Button>
          ) : (
            <Button type="button">입사자 등록</Button>
          )
        }
      />
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "입사자 정보 수정" : "입사자 등록"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "입사자 정보를 수정합니다. 주민등록번호는 별도 확인 후 변경할 수 있습니다."
              : "신규 입사자 정보를 등록합니다."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex min-h-0 flex-1 flex-col"
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
                isEdit && hireIntake
                  ? await updateHireIntake(hireIntake.id, formData)
                  : await createHireIntake(formData);

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
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
          {formError ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`name-${formId}`}>이름</Label>
              <Input
                id={`name-${formId}`}
                value={formValues.name}
                onChange={(event) => updateFormValue("name", event.target.value)}
                required
                maxLength={100}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`email-${formId}`}>이메일</Label>
              <Input
                id={`email-${formId}`}
                type="text"
                inputMode="email"
                autoComplete="email"
                value={formValues.email}
                onChange={(event) => updateFormValue("email", event.target.value)}
                required
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>주민등록번호</Label>
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
                      if (!hireIntake) {
                        return;
                      }
                      startTransition(async () => {
                        const result = await revealRRN(hireIntake.id, companyId);
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
                      if (!hireIntake) {
                        return;
                      }
                      startTransition(async () => {
                        const result = await revealRRN(hireIntake.id, companyId);
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
                  onChange={(rrnSegments) => updateFormValue("rrnSegments", rrnSegments)}
                  disabled={isPending}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`hireDate-${formId}`}>입사일</Label>
              <DateInput
                id={`hireDate-${formId}`}
                value={formValues.hireDate}
                onChange={(value) => updateFormValue("hireDate", value)}
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`department-${formId}`}>부서</Label>
              <select
                id={`department-${formId}`}
                value={formValues.department}
                onChange={(event) =>
                  updateFormValue("department", event.target.value)
                }
                className={selectClassName}
                disabled={departments.length === 0 || isPending}
              >
                <option value="">
                  {departments.length > 0 ? "선택 안 함" : "등록된 부서 없음"}
                </option>
                {departments.map((department) => (
                  <option key={department.id} value={department.name}>
                    {department.name}
                  </option>
                ))}
                {isEdit &&
                formValues.department &&
                !departments.some(
                  (department) => department.name === formValues.department,
                ) ? (
                  <option value={formValues.department}>
                    {formValues.department}
                  </option>
                ) : null}
              </select>
              {departments.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  설정 &gt; 부서 관리에서 부서를 먼저 등록해 주세요.
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`salaryType-${formId}`}>급여 유형</Label>
              <select
                id={`salaryType-${formId}`}
                value={formValues.salaryType}
                onChange={(event) =>
                  updateFormValue("salaryType", event.target.value as SalaryType)
                }
                className={selectClassName}
                required
              >
                {SALARY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {SALARY_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`salaryBasis-${formId}`}>급여 기준</Label>
              <select
                id={`salaryBasis-${formId}`}
                value={formValues.salaryBasis}
                onChange={(event) =>
                  updateFormValue("salaryBasis", event.target.value as SalaryBasis)
                }
                className={selectClassName}
                required
              >
                {SALARY_BASES.map((basis) => (
                  <option key={basis} value={basis}>
                    {SALARY_BASIS_LABELS[basis]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`salaryAmount-${formId}`}>급여 금액</Label>
              <Input
                id={`salaryAmount-${formId}`}
                type="text"
                inputMode="numeric"
                value={formatSalaryInput(formValues.salaryAmount)}
                onChange={(event) =>
                  updateFormValue(
                    "salaryAmount",
                    parseSalaryInput(event.target.value),
                  )
                }
                required
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`isContract-${formId}`}>고용 형태</Label>
              <select
                id={`isContract-${formId}`}
                value={formValues.isContract}
                onChange={(event) =>
                  updateFormValue("isContract", event.target.value)
                }
                className={selectClassName}
                required
              >
                <option value="false">정규직</option>
                <option value="true">계약직</option>
              </select>
            </div>

            {isContract ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor={`contractStart-${formId}`}>계약 시작일</Label>
                  <DateInput
                    id={`contractStart-${formId}`}
                    value={formValues.contractStart}
                    onChange={(value) => updateFormValue("contractStart", value)}
                    required
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`contractEnd-${formId}`}>계약 종료일</Label>
                  <DateInput
                    id={`contractEnd-${formId}`}
                    value={formValues.contractEnd}
                    onChange={(value) => updateFormValue("contractEnd", value)}
                    required
                    disabled={isPending}
                  />
                </div>
              </>
            ) : null}
          </div>

          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between gap-2">
              <Label>비과세 항목</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() =>
                  setFormValues((current) => ({
                    ...current,
                    nonTaxableAllowances: [
                      ...current.nonTaxableAllowances,
                      createAllowanceRow(),
                    ],
                  }))
                }
              >
                <Plus className="size-4" />
                항목 추가
              </Button>
            </div>
            {formValues.nonTaxableAllowances.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                비과세 항목이 없으면 추가하지 않아도 됩니다.
              </p>
            ) : (
              <div className="space-y-2">
                {formValues.nonTaxableAllowances.map((row, index) => (
                  <div
                    key={row.id}
                    className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_auto]"
                  >
                    <div className="space-y-1">
                      <Label htmlFor={`allowance-type-${formId}-${index}`}>
                        종류
                      </Label>
                      <select
                        id={`allowance-type-${formId}-${index}`}
                        value={row.type}
                        onChange={(event) =>
                          setFormValues((current) => ({
                            ...current,
                            nonTaxableAllowances: current.nonTaxableAllowances.map(
                              (item) =>
                                item.id === row.id
                                  ? {
                                      ...item,
                                      type: event.target
                                        .value as NonTaxableAllowanceFormRow["type"],
                                    }
                                  : item,
                            ),
                          }))
                        }
                        className={selectClassName}
                        disabled={isPending}
                      >
                        <option value="">선택</option>
                        {NON_TAXABLE_ALLOWANCE_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`allowance-amount-${formId}-${index}`}>
                        금액
                      </Label>
                      <Input
                        id={`allowance-amount-${formId}-${index}`}
                        type="text"
                        inputMode="numeric"
                        value={formatSalaryInput(row.amount)}
                        onChange={(event) =>
                          setFormValues((current) => ({
                            ...current,
                            nonTaxableAllowances: current.nonTaxableAllowances.map(
                              (item) =>
                                item.id === row.id
                                  ? {
                                      ...item,
                                      amount: parseSalaryInput(event.target.value),
                                    }
                                  : item,
                            ),
                          }))
                        }
                        disabled={isPending}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        disabled={isPending}
                        aria-label="비과세 항목 삭제"
                        onClick={() =>
                          setFormValues((current) => ({
                            ...current,
                            nonTaxableAllowances:
                              current.nonTaxableAllowances.filter(
                                (item) => item.id !== row.id,
                              ),
                          }))
                        }
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                    {row.type === "기타" ? (
                      <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor={`allowance-label-${formId}-${index}`}>
                          항목명
                        </Label>
                        <Input
                          id={`allowance-label-${formId}-${index}`}
                          value={row.customLabel}
                          onChange={(event) =>
                            setFormValues((current) => ({
                              ...current,
                              nonTaxableAllowances: current.nonTaxableAllowances.map(
                                (item) =>
                                  item.id === row.id
                                    ? { ...item, customLabel: event.target.value }
                                    : item,
                              ),
                            }))
                          }
                          disabled={isPending}
                          maxLength={50}
                        />
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3 border-t pt-4">
            <Label>급여계좌</Label>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`bankPreset-${formId}`}>은행</Label>
                <select
                  id={`bankPreset-${formId}`}
                  value={formValues.bankPreset}
                  onChange={(event) =>
                    updateFormValue("bankPreset", event.target.value)
                  }
                  className={selectClassName}
                  disabled={isPending}
                >
                  <option value="">선택 안 함</option>
                  {KOREAN_BANKS.map((bank) => (
                    <option key={bank} value={bank}>
                      {bank}
                    </option>
                  ))}
                  <option value={BANK_CUSTOM_VALUE}>직접입력</option>
                </select>
              </div>
              {formValues.bankPreset === BANK_CUSTOM_VALUE ? (
                <div className="space-y-2">
                  <Label htmlFor={`bankNameCustom-${formId}`}>은행명</Label>
                  <Input
                    id={`bankNameCustom-${formId}`}
                    value={formValues.bankNameCustom}
                    onChange={(event) =>
                      updateFormValue("bankNameCustom", event.target.value)
                    }
                    disabled={isPending}
                    maxLength={50}
                  />
                </div>
              ) : null}
              <div
                className={
                  formValues.bankPreset === BANK_CUSTOM_VALUE
                    ? "space-y-2 sm:col-span-2"
                    : "space-y-2"
                }
              >
                <Label htmlFor={`accountNumber-${formId}`}>계좌번호</Label>
                <Input
                  id={`accountNumber-${formId}`}
                  type="text"
                  inputMode="numeric"
                  value={formValues.accountNumber}
                  onChange={(event) =>
                    updateFormValue(
                      "accountNumber",
                      event.target.value.replace(/\D/g, ""),
                    )
                  }
                  disabled={isPending}
                  maxLength={20}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`phone-${formId}`}>연락처</Label>
              <Input
                id={`phone-${formId}`}
                type="tel"
                inputMode="numeric"
                value={formatPhone(formValues.phone)}
                onChange={(event) =>
                  updateFormValue("phone", parsePhoneInput(event.target.value))
                }
                disabled={isPending}
                placeholder="010-1234-5678"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`notes-${formId}`}>비고</Label>
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
