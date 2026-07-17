export const MAX_ATTACHMENTS_PER_RECORD = 5;

/** Per-file limit for attachment uploads. */
export const MAX_ATTACHMENT_FILE_SIZE_BYTES = 4 * 1024 * 1024;

/** Combined limit for all new files in a single save request. */
export const MAX_ATTACHMENT_UPLOAD_BYTES = 10 * 1024 * 1024;

export const ALLOWED_ATTACHMENT_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".doc",
  ".docx",
  ".pdf",
] as const;

export const ALLOWED_ATTACHMENT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

const extensionToMime: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".pdf": "application/pdf",
};

export function getAttachmentExtension(filename: string): string {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex < 0) {
    return "";
  }
  return filename.slice(dotIndex).toLowerCase();
}

export function isAllowedAttachmentFile(file: {
  name: string;
  type: string;
}): boolean {
  const extension = getAttachmentExtension(file.name);
  if (
    !ALLOWED_ATTACHMENT_EXTENSIONS.includes(
      extension as (typeof ALLOWED_ATTACHMENT_EXTENSIONS)[number],
    )
  ) {
    return false;
  }

  if (!file.type) {
    return extension in extensionToMime;
  }

  return (
    ALLOWED_ATTACHMENT_MIME_TYPES.includes(
      file.type as (typeof ALLOWED_ATTACHMENT_MIME_TYPES)[number],
    ) || file.type === extensionToMime[extension]
  );
}

export function formatAttachmentFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    const megabytes = bytes / (1024 * 1024);
    return Number.isInteger(megabytes) ? `${megabytes}MB` : `${megabytes.toFixed(1)}MB`;
  }

  const kilobytes = Math.max(1, Math.round(bytes / 1024));
  return `${kilobytes}KB`;
}

export function getAttachmentSizeValidationError(file: { name: string; size: number }): string | null {
  if (file.size <= MAX_ATTACHMENT_FILE_SIZE_BYTES) {
    return null;
  }

  return `파일당 최대 ${formatAttachmentFileSize(MAX_ATTACHMENT_FILE_SIZE_BYTES)}까지 첨부할 수 있습니다. (${file.name})`;
}

export function validateAttachmentFilesForUpload(files: File[]): string | null {
  for (const file of files) {
    const sizeError = getAttachmentSizeValidationError(file);
    if (sizeError) {
      return sizeError;
    }
  }

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  if (totalBytes > MAX_ATTACHMENT_UPLOAD_BYTES) {
    return `한 번에 첨부할 수 있는 파일 용량은 최대 ${formatAttachmentFileSize(MAX_ATTACHMENT_UPLOAD_BYTES)}입니다.`;
  }

  return null;
}

export function getAttachmentValidationError(file: {
  name: string;
  type: string;
  size?: number;
}): string | null {
  if (file.size !== undefined) {
    const sizeError = getAttachmentSizeValidationError({
      name: file.name,
      size: file.size,
    });
    if (sizeError) {
      return sizeError;
    }
  }

  if (isAllowedAttachmentFile(file)) {
    return null;
  }

  return "JPG, JPEG, PNG, DOC, DOCX, PDF 파일만 첨부할 수 있습니다.";
}

export function getAttachmentUploadErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (
      error.message.includes("Body exceeded") ||
      error.message.includes("413") ||
      error.message.includes("body size limit")
    ) {
      return `첨부 파일 용량이 너무 큽니다. 파일당 ${formatAttachmentFileSize(MAX_ATTACHMENT_FILE_SIZE_BYTES)} 이하, 전체 ${formatAttachmentFileSize(MAX_ATTACHMENT_UPLOAD_BYTES)} 이하로 다시 시도해 주세요.`;
    }

    return error.message;
  }

  return "첨부 파일을 저장할 수 없습니다.";
}
