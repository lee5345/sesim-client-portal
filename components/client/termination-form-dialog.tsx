"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import { Eye, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";

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
import {
  createTermination,
  revealTerminationRRN,
  updateTermination,
} from "@/modules/terminations/actions";
import {
  TERMINATION_REASON_CUSTOM_VALUE,
  TERMINATION_REASON_PRESETS,
  getReasonFormValues,
} from "@/modules/terminations/constants";

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

function FieldLabel({
  htmlFor,
  required = false,
  children,
}: {
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <Label htmlFor={htmlFor}>
      {children}
      {required ? (
        <span className="text-destructive" aria-hidden="true">
          {" "}
          *
        </span>
      ) : null}
    </Label>
  );
}

type TerminationFormValues = {
  name: string;
  rrnSegments: string[];
  terminationDate: string;
  reasonPreset: string;
  reasonCustom: string;
};

type TerminationFormDialogProps = {
  mode: "create" | "edit";
  companyId?: string;
  termination?: {
    id: string;
    name: string;
    terminationDate: string;
    reason: string;
  };
};

function createEmptyRrnSegments() {
  return splitIntoSegments("", [...RRN_SEGMENT_LENGTHS]);
}

function getInitialFormValues(
  termination: TerminationFormDialogProps["termination"],
): TerminationFormValues {
  const { reasonPreset, reasonCustom } = getReasonFormValues(termination?.reason);

  return {
    name: termination?.name ?? "",
    rrnSegments: createEmptyRrnSegments(),
    terminationDate: termination?.terminationDate ?? "",
    reasonPreset,
    reasonCustom,
  };
}

function buildFormData(
  values: TerminationFormValues,
  options: { includeRrn: boolean; companyId?: string },
): FormData {
  const formData = new FormData();

  if (options.companyId) {
    formData.set("companyId", options.companyId);
  }

  formData.set("name", values.name);
  formData.set("terminationDate", values.terminationDate);
  formData.set("reasonPreset", values.reasonPreset);
  formData.set("reasonCustom", values.reasonCustom);

  if (options.includeRrn) {
    formData.set(
      "rrn",
      joinRrnSegments(values.rrnSegments[0] ?? "", values.rrnSegments[1] ?? ""),
    );
  }

  return formData;
}

export function TerminationFormDialog({
  mode,
  companyId,
  termination,
}: TerminationFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formValues, setFormValues] = useState<TerminationFormValues>(() =>
    getInitialFormValues(termination),
  );
  const [rrnEditing, setRrnEditing] = useState(mode === "create");
  const [revealedRrn, setRevealedRrn] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isEdit = mode === "edit";
  const formId = `${mode}-${termination?.id ?? "new"}`;
  const rrnRequired = !isEdit || rrnEditing;
  const isCustomReason =
    formValues.reasonPreset === TERMINATION_REASON_CUSTOM_VALUE;

  useEffect(() => {
    if (!open) {
      return;
    }

    setFormValues(getInitialFormValues(termination));
    setRrnEditing(mode === "create");
    setRevealedRrn(null);
    setFormError(null);
  }, [open, termination, mode]);

  function updateFormValue<K extends keyof TerminationFormValues>(
    key: K,
    value: TerminationFormValues[K],
  ) {
    setFormValues((current) => ({ ...current, [key]: value }));
  }

  function resetState() {
    setFormValues(getInitialFormValues(termination));
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
            <Button variant="outline" size="icon-sm" aria-label="퇴사자 정보 수정">
              <Pencil className="size-4" />
            </Button>
          ) : (
            <Button type="button">퇴사자 등록</Button>
          )
        }
      />
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "퇴사자 정보 수정" : "퇴사자 등록"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "퇴사자 정보를 수정합니다. 주민등록번호는 별도 확인 후 변경할 수 있습니다."
              : "퇴사자 정보를 등록합니다."}
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
                isEdit && termination
                  ? await updateTermination(termination.id, formData)
                  : await createTermination(formData);

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
                      if (!termination) {
                        return;
                      }
                      startTransition(async () => {
                        const result = await revealTerminationRRN(
                          termination.id,
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
                      if (!termination) {
                        return;
                      }
                      startTransition(async () => {
                        const result = await revealTerminationRRN(
                          termination.id,
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

            <div className="space-y-2">
              <FieldLabel htmlFor={`terminationDate-${formId}`} required>
                퇴사일
              </FieldLabel>
              <DateInput
                id={`terminationDate-${formId}`}
                value={formValues.terminationDate}
                onChange={(value) => updateFormValue("terminationDate", value)}
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor={`reasonPreset-${formId}`} required>
                퇴사 사유
              </FieldLabel>
              <select
                id={`reasonPreset-${formId}`}
                value={formValues.reasonPreset}
                onChange={(event) =>
                  updateFormValue("reasonPreset", event.target.value)
                }
                className={selectClassName}
                required
                disabled={isPending}
              >
                <option value="">선택</option>
                {TERMINATION_REASON_PRESETS.map((preset) => (
                  <option key={preset} value={preset}>
                    {preset}
                  </option>
                ))}
                <option value={TERMINATION_REASON_CUSTOM_VALUE}>직접입력</option>
              </select>
            </div>

            {isCustomReason ? (
              <div className="space-y-2">
                <FieldLabel htmlFor={`reasonCustom-${formId}`} required>
                  퇴사 사유 (직접입력)
                </FieldLabel>
                <Input
                  id={`reasonCustom-${formId}`}
                  value={formValues.reasonCustom}
                  onChange={(event) =>
                    updateFormValue("reasonCustom", event.target.value)
                  }
                  required
                  maxLength={200}
                  disabled={isPending}
                />
              </div>
            ) : null}
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
