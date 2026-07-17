"use client";

import { useRef, useState } from "react";
import { FileText, Paperclip, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FieldLabel } from "@/components/ui/field-label";
import {
  ALLOWED_ATTACHMENT_EXTENSIONS,
  MAX_ATTACHMENTS_PER_RECORD,
  getAttachmentValidationError,
  validateAttachmentFilesForUpload,
} from "@/lib/storage/attachment-constraints";
import type { AttachmentSummary } from "@/modules/attachments/actions";

type PendingFile = {
  key: string;
  file: File;
};

type FileAttachmentFieldProps = {
  existingAttachments?: AttachmentSummary[];
  disabled?: boolean;
  onPendingFilesChange: (files: File[]) => void;
  onRemovedAttachmentIdsChange: (ids: string[]) => void;
};

function formatAllowedExtensions() {
  return ALLOWED_ATTACHMENT_EXTENSIONS.map((ext) => ext.replace(".", "").toUpperCase()).join(
    ", ",
  );
}

export function FileAttachmentField({
  existingAttachments = [],
  disabled = false,
  onPendingFilesChange,
  onRemovedAttachmentIdsChange,
}: FileAttachmentFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const visibleExisting = existingAttachments.filter(
    (attachment) => !removedAttachmentIds.includes(attachment.id),
  );
  const totalCount = visibleExisting.length + pendingFiles.length;
  const canAddMore = totalCount < MAX_ATTACHMENTS_PER_RECORD;

  function updatePendingFiles(next: PendingFile[]) {
    setPendingFiles(next);
    onPendingFilesChange(next.map((item) => item.file));
  }

  function updateRemovedIds(next: string[]) {
    setRemovedAttachmentIds(next);
    onRemovedAttachmentIdsChange(next);
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (selected.length === 0) {
      return;
    }

    const availableSlots = MAX_ATTACHMENTS_PER_RECORD - totalCount;
    if (availableSlots <= 0) {
      setError(`첨부 파일은 최대 ${MAX_ATTACHMENTS_PER_RECORD}개까지 등록할 수 있습니다.`);
      return;
    }

    const nextPending = [...pendingFiles];
    for (const file of selected.slice(0, availableSlots)) {
      const validationError = getAttachmentValidationError(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      const batchError = validateAttachmentFilesForUpload([
        ...nextPending.map((item) => item.file),
        file,
      ]);
      if (batchError) {
        setError(batchError);
        return;
      }

      nextPending.push({
        key: `${file.name}-${file.size}-${file.lastModified}-${nextPending.length}`,
        file,
      });
    }

    setError(null);
    updatePendingFiles(nextPending);
  }

  function removePendingFile(key: string) {
    updatePendingFiles(pendingFiles.filter((item) => item.key !== key));
    setError(null);
  }

  function removeExistingAttachment(id: string) {
    updateRemovedIds([...removedAttachmentIds, id]);
    setError(null);
  }

  return (
    <div className="space-y-2">
      <FieldLabel>파일 첨부</FieldLabel>
      <div className="space-y-2 rounded-lg border border-dashed p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || !canAddMore}
            onClick={() => inputRef.current?.click()}
          >
            <Paperclip />
            파일 선택
          </Button>
          <span className="text-xs text-muted-foreground">
            {formatAllowedExtensions()} · 최대 {MAX_ATTACHMENTS_PER_RECORD}개 (
            {totalCount}/{MAX_ATTACHMENTS_PER_RECORD})
          </span>
        </div>

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple
          accept={ALLOWED_ATTACHMENT_EXTENSIONS.join(",")}
          disabled={disabled || !canAddMore}
          onChange={handleFileSelect}
        />

        {visibleExisting.length > 0 ? (
          <ul className="space-y-1">
            {visibleExisting.map((attachment) => (
              <li
                key={attachment.id}
                className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-2 py-1.5 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{attachment.filename}</span>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={disabled}
                  onClick={() => removeExistingAttachment(attachment.id)}
                  aria-label={`${attachment.filename} 제거`}
                >
                  <X />
                </Button>
              </li>
            ))}
          </ul>
        ) : null}

        {pendingFiles.length > 0 ? (
          <ul className="space-y-1">
            {pendingFiles.map((item) => (
              <li
                key={item.key}
                className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-2 py-1.5 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{item.file.name}</span>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={disabled}
                  onClick={() => removePendingFile(item.key)}
                  aria-label={`${item.file.name} 제거`}
                >
                  <X />
                </Button>
              </li>
            ))}
          </ul>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}
