"use client";

import { useEffect, useState, useTransition } from "react";
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
import { FieldLabel } from "@/components/ui/field-label";
import { FileAttachmentField } from "@/components/ui/file-attachment-field";
import { Input } from "@/components/ui/input";
import {
  joinRrnSegments,
  RRN_SEGMENT_LENGTHS,
  splitIntoSegments,
} from "@/lib/form/segmented-digits";
import {
  getAttachmentUploadErrorMessage,
  validateAttachmentFilesForUpload,
} from "@/lib/storage/attachment-constraints";
import type { LeaveType } from "@/lib/generated/prisma/client";
import {
  createLeaveRecord,
  revealLeaveRecordChildRrn,
  updateLeaveRecord,
} from "@/modules/leave-records/actions";
import {
  LEAVE_TYPES,
  LEAVE_TYPE_LABELS,
  requiresChildInfo,
  requiresExpectedDeliveryDate,
  requiresHourReduction,
} from "@/modules/leave-records/constants";
import type { AttachmentSummary } from "@/modules/attachments/actions";

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

type LeaveRecordFormValues = {
  name: string;
  leaveType: LeaveType | "";
  periodStart: string;
  periodEnd: string;
  expectedDeliveryDate: string;
  childName: string;
  childRrnSegments: string[];
  hoursBeforeReduction: string;
  hoursAfterReduction: string;
};

type LeaveRecordFormDialogProps = {
  mode: "create" | "edit";
  companyId?: string;
  disabled?: boolean;
  leaveRecord?: {
    id: string;
    name: string;
    leaveType: LeaveType;
    periodStart: string;
    periodEnd: string;
    expectedDeliveryDate: string | null;
    childName: string | null;
    hoursBeforeReduction: number | null;
    hoursAfterReduction: number | null;
    attachments: AttachmentSummary[];
  };
};

function createEmptyRrnSegments() {
  return splitIntoSegments("", [...RRN_SEGMENT_LENGTHS]);
}

function getInitialFormValues(
  leaveRecord: LeaveRecordFormDialogProps["leaveRecord"],
): LeaveRecordFormValues {
  return {
    name: leaveRecord?.name ?? "",
    leaveType: leaveRecord?.leaveType ?? "",
    periodStart: leaveRecord?.periodStart ?? "",
    periodEnd: leaveRecord?.periodEnd ?? "",
    expectedDeliveryDate: leaveRecord?.expectedDeliveryDate ?? "",
    childName: leaveRecord?.childName ?? "",
    childRrnSegments: createEmptyRrnSegments(),
    hoursBeforeReduction:
      leaveRecord?.hoursBeforeReduction !== null &&
      leaveRecord?.hoursBeforeReduction !== undefined
        ? String(leaveRecord.hoursBeforeReduction)
        : "",
    hoursAfterReduction:
      leaveRecord?.hoursAfterReduction !== null &&
      leaveRecord?.hoursAfterReduction !== undefined
        ? String(leaveRecord.hoursAfterReduction)
        : "",
  };
}

function buildFormData(
  values: LeaveRecordFormValues,
  options: {
    companyId?: string;
    pendingFiles: File[];
    removedAttachmentIds: string[];
    includeChildRrn: boolean;
  },
): FormData {
  const formData = new FormData();

  if (options.companyId) {
    formData.set("companyId", options.companyId);
  }

  formData.set("name", values.name);
  formData.set("leaveType", values.leaveType);
  formData.set("periodStart", values.periodStart);
  formData.set("periodEnd", values.periodEnd);
  formData.set("expectedDeliveryDate", values.expectedDeliveryDate);
  formData.set("childName", values.childName);
  formData.set("hoursBeforeReduction", values.hoursBeforeReduction);
  formData.set("hoursAfterReduction", values.hoursAfterReduction);

  if (options.includeChildRrn) {
    formData.set(
      "childRrn",
      joinRrnSegments(
        values.childRrnSegments[0] ?? "",
        values.childRrnSegments[1] ?? "",
      ),
    );
  }

  if (options.removedAttachmentIds.length > 0) {
    formData.set("attachmentIdsToRemove", options.removedAttachmentIds.join(","));
  }

  for (const file of options.pendingFiles) {
    formData.append("attachments", file);
  }

  return formData;
}

export function LeaveRecordFormDialog({
  mode,
  companyId,
  disabled = false,
  leaveRecord,
}: LeaveRecordFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formValues, setFormValues] = useState<LeaveRecordFormValues>(() =>
    getInitialFormValues(leaveRecord),
  );
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<string[]>([]);
  const [childRrnEditing, setChildRrnEditing] = useState(mode === "create");
  const [revealedChildRrn, setRevealedChildRrn] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isEdit = mode === "edit";
  const formId = `${mode}-${leaveRecord?.id ?? "new"}`;
  const leaveType = formValues.leaveType;
  const showDeliveryDate =
    leaveType !== "" && requiresExpectedDeliveryDate(leaveType);
  const showChildInfo = leaveType !== "" && requiresChildInfo(leaveType);
  const showHourReduction = leaveType !== "" && requiresHourReduction(leaveType);
  const childRrnRequired = !isEdit || childRrnEditing;

  useEffect(() => {
    if (!open) {
      return;
    }
    setFormValues(getInitialFormValues(leaveRecord));
    setPendingFiles([]);
    setRemovedAttachmentIds([]);
    setChildRrnEditing(mode === "create");
    setRevealedChildRrn(null);
    setFormError(null);
  }, [open, leaveRecord, mode]);

  function updateFormValue<K extends keyof LeaveRecordFormValues>(
    key: K,
    value: LeaveRecordFormValues[K],
  ) {
    setFormValues((current) => ({ ...current, [key]: value }));
  }

  function resetState() {
    setFormValues(getInitialFormValues(leaveRecord));
    setPendingFiles([]);
    setRemovedAttachmentIds([]);
    setChildRrnEditing(mode === "create");
    setRevealedChildRrn(null);
    setFormError(null);
  }

  function startChildRrnEditing(rrn?: string) {
    setChildRrnEditing(true);
    if (rrn) {
      setFormValues((current) => ({
        ...current,
        childRrnSegments: splitIntoSegments(rrn, [...RRN_SEGMENT_LENGTHS]),
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
        disabled={disabled}
        render={
          isEdit ? (
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="휴직자 정보 수정"
              disabled={disabled}
            >
              <Pencil className="size-4" />
            </Button>
          ) : (
            <Button type="button" disabled={disabled}>
              휴직자 등록
            </Button>
          )
        }
      />
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "휴직자 정보 수정" : "휴직자 등록"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "휴직자 정보를 수정합니다." : "휴직자 정보를 등록합니다."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex min-h-0 flex-1 flex-col gap-4"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            setFormError(null);

            startTransition(async () => {
              const attachmentError = validateAttachmentFilesForUpload(pendingFiles);
              if (attachmentError) {
                setFormError(attachmentError);
                return;
              }

              try {
                const includeChildRrn =
                  showChildInfo && (!isEdit || childRrnEditing);
                const formData = buildFormData(formValues, {
                  companyId,
                  pendingFiles,
                  removedAttachmentIds,
                  includeChildRrn,
                });
                const result =
                  isEdit && leaveRecord
                    ? await updateLeaveRecord(leaveRecord.id, formData)
                    : await createLeaveRecord(formData);

                if (!result.success) {
                  setFormError(result.error);
                  return;
                }

                setOpen(false);
                resetState();
                router.refresh();
              } catch (error) {
                setFormError(getAttachmentUploadErrorMessage(error));
              }
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
                <FieldLabel htmlFor={`leaveType-${formId}`} required>
                  종류
                </FieldLabel>
                <select
                  id={`leaveType-${formId}`}
                  value={formValues.leaveType}
                  onChange={(event) =>
                    updateFormValue("leaveType", event.target.value as LeaveType)
                  }
                  className={selectClassName}
                  required
                  disabled={isPending}
                >
                  <option value="" disabled>
                    종류 선택
                  </option>
                  {LEAVE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {LEAVE_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel htmlFor={`periodStart-${formId}`} required>
                  기간 시작일
                </FieldLabel>
                <DateInput
                  id={`periodStart-${formId}`}
                  value={formValues.periodStart}
                  onChange={(value) => updateFormValue("periodStart", value)}
                  required
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor={`periodEnd-${formId}`} required>
                  기간 종료일
                </FieldLabel>
                <DateInput
                  id={`periodEnd-${formId}`}
                  value={formValues.periodEnd}
                  onChange={(value) => updateFormValue("periodEnd", value)}
                  required
                  disabled={isPending}
                />
              </div>
            </div>

            {showDeliveryDate ? (
              <div className="space-y-2">
                <FieldLabel htmlFor={`expectedDeliveryDate-${formId}`} required>
                  출산(예정)일
                </FieldLabel>
                <DateInput
                  id={`expectedDeliveryDate-${formId}`}
                  value={formValues.expectedDeliveryDate}
                  onChange={(value) => updateFormValue("expectedDeliveryDate", value)}
                  required
                  disabled={isPending}
                />
              </div>
            ) : null}

            {showChildInfo ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <FieldLabel htmlFor={`childName-${formId}`} required>
                    대상자녀 이름
                  </FieldLabel>
                  <Input
                    id={`childName-${formId}`}
                    value={formValues.childName}
                    onChange={(event) =>
                      updateFormValue("childName", event.target.value)
                    }
                    required
                    maxLength={100}
                    disabled={isPending}
                  />
                </div>

                <div className="space-y-2">
                  <FieldLabel required={childRrnRequired}>
                    대상자녀 주민번호
                  </FieldLabel>
                  {isEdit && !childRrnEditing ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm text-muted-foreground">
                        {revealedChildRrn ?? "******-*******"}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        onClick={() => {
                          if (!leaveRecord) {
                            return;
                          }
                          startTransition(async () => {
                            const rrn = await revealLeaveRecordChildRrn(
                              leaveRecord.id,
                              companyId,
                            );
                            setRevealedChildRrn(rrn);
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
                          if (revealedChildRrn) {
                            startChildRrnEditing(revealedChildRrn);
                            return;
                          }
                          if (!leaveRecord) {
                            return;
                          }
                          startTransition(async () => {
                            const rrn = await revealLeaveRecordChildRrn(
                              leaveRecord.id,
                              companyId,
                            );
                            setRevealedChildRrn(rrn);
                            startChildRrnEditing(rrn);
                          });
                        }}
                      >
                        변경
                      </Button>
                    </div>
                  ) : (
                    <SegmentedDigitFields
                      idPrefix={`childRrn-${formId}`}
                      segmentLengths={[...RRN_SEGMENT_LENGTHS]}
                      values={formValues.childRrnSegments}
                      onChange={(childRrnSegments) =>
                        updateFormValue("childRrnSegments", childRrnSegments)
                      }
                      disabled={isPending}
                    />
                  )}
                </div>
              </div>
            ) : null}

            {showHourReduction ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <FieldLabel htmlFor={`hoursBeforeReduction-${formId}`} required>
                    단축 전 근로시간
                  </FieldLabel>
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="shrink-0 whitespace-nowrap text-sm text-muted-foreground">
                      주
                    </span>
                    <Input
                      id={`hoursBeforeReduction-${formId}`}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      step={1}
                      className="min-w-0 flex-1"
                      value={formValues.hoursBeforeReduction}
                      onChange={(event) =>
                        updateFormValue("hoursBeforeReduction", event.target.value)
                      }
                      required
                      disabled={isPending}
                    />
                    <span className="shrink-0 whitespace-nowrap text-sm text-muted-foreground">
                      시간
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <FieldLabel htmlFor={`hoursAfterReduction-${formId}`} required>
                    단축 후 근로시간
                  </FieldLabel>
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="shrink-0 whitespace-nowrap text-sm text-muted-foreground">
                      주
                    </span>
                    <Input
                      id={`hoursAfterReduction-${formId}`}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      step={1}
                      className="min-w-0 flex-1"
                      value={formValues.hoursAfterReduction}
                      onChange={(event) =>
                        updateFormValue("hoursAfterReduction", event.target.value)
                      }
                      required
                      disabled={isPending}
                    />
                    <span className="shrink-0 whitespace-nowrap text-sm text-muted-foreground">
                      시간
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            <FileAttachmentField
              existingAttachments={leaveRecord?.attachments ?? []}
              disabled={isPending}
              onPendingFilesChange={setPendingFiles}
              onRemovedAttachmentIdsChange={setRemovedAttachmentIds}
            />
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
              저장
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
