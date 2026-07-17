"use client";

import { useEffect, useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";

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
  getAttachmentUploadErrorMessage,
  validateAttachmentFilesForUpload,
} from "@/lib/storage/attachment-constraints";
import {
  createDependentRecord,
  updateDependentRecord,
} from "@/modules/dependents/actions";
import type { AttachmentSummary } from "@/modules/attachments/actions";

type DependentFormValues = {
  employeeName: string;
  dependentName: string;
  relationship: string;
  registrationRequestedDate: string;
};

type DependentFormDialogProps = {
  mode: "create" | "edit";
  companyId?: string;
  disabled?: boolean;
  dependentRecord?: {
    id: string;
    employeeName: string;
    dependentName: string;
    relationship: string;
    registrationRequestedDate: string;
    attachments: AttachmentSummary[];
  };
};

function getInitialFormValues(
  dependentRecord: DependentFormDialogProps["dependentRecord"],
): DependentFormValues {
  return {
    employeeName: dependentRecord?.employeeName ?? "",
    dependentName: dependentRecord?.dependentName ?? "",
    relationship: dependentRecord?.relationship ?? "",
    registrationRequestedDate: dependentRecord?.registrationRequestedDate ?? "",
  };
}

function buildFormData(
  values: DependentFormValues,
  options: {
    companyId?: string;
    pendingFiles: File[];
    removedAttachmentIds: string[];
  },
): FormData {
  const formData = new FormData();

  if (options.companyId) {
    formData.set("companyId", options.companyId);
  }

  formData.set("employeeName", values.employeeName);
  formData.set("dependentName", values.dependentName);
  formData.set("relationship", values.relationship);
  formData.set("registrationRequestedDate", values.registrationRequestedDate);

  if (options.removedAttachmentIds.length > 0) {
    formData.set("attachmentIdsToRemove", options.removedAttachmentIds.join(","));
  }

  for (const file of options.pendingFiles) {
    formData.append("attachments", file);
  }

  return formData;
}

export function DependentFormDialog({
  mode,
  companyId,
  disabled = false,
  dependentRecord,
}: DependentFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formValues, setFormValues] = useState<DependentFormValues>(() =>
    getInitialFormValues(dependentRecord),
  );
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isEdit = mode === "edit";
  const formId = `${mode}-${dependentRecord?.id ?? "new"}`;

  useEffect(() => {
    if (!open) {
      return;
    }
    setFormValues(getInitialFormValues(dependentRecord));
    setPendingFiles([]);
    setRemovedAttachmentIds([]);
    setFormError(null);
  }, [open, dependentRecord]);

  function updateFormValue<K extends keyof DependentFormValues>(
    key: K,
    value: DependentFormValues[K],
  ) {
    setFormValues((current) => ({ ...current, [key]: value }));
  }

  function resetState() {
    setFormValues(getInitialFormValues(dependentRecord));
    setPendingFiles([]);
    setRemovedAttachmentIds([]);
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
              aria-label="피부양자 정보 수정"
              disabled={disabled}
            >
              <Pencil className="size-4" />
            </Button>
          ) : (
            <Button type="button" disabled={disabled}>
              피부양자 등록
            </Button>
          )
        }
      />
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "피부양자 정보 수정" : "피부양자 등록"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "피부양자 정보를 수정합니다." : "피부양자 정보를 등록합니다."}
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
                const formData = buildFormData(formValues, {
                  companyId,
                  pendingFiles,
                  removedAttachmentIds,
                });
                const result =
                  isEdit && dependentRecord
                    ? await updateDependentRecord(dependentRecord.id, formData)
                    : await createDependentRecord(formData);

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
                <FieldLabel htmlFor={`employeeName-${formId}`} required>
                  직원 이름
                </FieldLabel>
                <Input
                  id={`employeeName-${formId}`}
                  value={formValues.employeeName}
                  onChange={(event) =>
                    updateFormValue("employeeName", event.target.value)
                  }
                  required
                  maxLength={100}
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor={`dependentName-${formId}`} required>
                  피부양자 이름
                </FieldLabel>
                <Input
                  id={`dependentName-${formId}`}
                  value={formValues.dependentName}
                  onChange={(event) =>
                    updateFormValue("dependentName", event.target.value)
                  }
                  required
                  maxLength={100}
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel htmlFor={`relationship-${formId}`} required>
                  관계
                </FieldLabel>
                <Input
                  id={`relationship-${formId}`}
                  value={formValues.relationship}
                  onChange={(event) =>
                    updateFormValue("relationship", event.target.value)
                  }
                  required
                  maxLength={100}
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor={`registrationRequestedDate-${formId}`} required>
                  등록 희망일
                </FieldLabel>
                <DateInput
                  id={`registrationRequestedDate-${formId}`}
                  value={formValues.registrationRequestedDate}
                  onChange={(value) =>
                    updateFormValue("registrationRequestedDate", value)
                  }
                  required
                  disabled={isPending}
                />
              </div>
            </div>

            <FileAttachmentField
              existingAttachments={dependentRecord?.attachments ?? []}
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
