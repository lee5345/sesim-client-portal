export const MAX_ATTACHMENTS_PER_RECORD = 5;

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

export function getAttachmentValidationError(file: {
  name: string;
  type: string;
}): string | null {
  if (isAllowedAttachmentFile(file)) {
    return null;
  }

  return "JPG, JPEG, PNG, DOC, DOCX, PDF 파일만 첨부할 수 있습니다.";
}
