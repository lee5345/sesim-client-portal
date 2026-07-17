import { del, head, put } from "@vercel/blob";

import {
  getAttachmentValidationError,
  validateAttachmentFilesForUpload,
} from "@/lib/storage/attachment-constraints";

function getBlobToken(): string {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error("BLOB TOKEN ENV VAR이 설정되지 않았습니다. 개발자에게 문의하세요.");
  }
  return token;
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^\w.\-()가-힣]/g, "_").slice(0, 200);
}

export function buildAttachmentBlobPath(input: {
  companyId: string;
  entityType: string;
  entityId: string;
  filename: string;
}): string {
  const safeName = sanitizeFilename(input.filename);
  return `attachments/${input.companyId}/${input.entityType}/${input.entityId}/${Date.now()}-${safeName}`;
}

export async function putPrivateAttachmentBlob(
  pathname: string,
  file: File | Blob,
): Promise<{ pathname: string; sizeBytes: number; mimeType: string }> {
  if (!(file instanceof File)) {
    throw new Error("첨부 파일 형식이 올바르지 않습니다.");
  }

  const validationError = getAttachmentValidationError(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const result = await put(pathname, file, {
    access: "private",
    token: getBlobToken(),
    contentType: file.type || undefined,
  });

  return {
    pathname: result.pathname,
    sizeBytes: file.size,
    mimeType: file.type || "application/octet-stream",
  };
}

export async function deleteAttachmentBlob(pathname: string): Promise<void> {
  await del(pathname, { token: getBlobToken() });
}

export async function createPrivateAttachmentDownloadUrl(
  pathname: string,
): Promise<string> {
  const blob = await head(pathname, { token: getBlobToken() });
  return blob.url;
}

export function parseAttachmentFilesFromFormData(formData: FormData): File[] {
  const files = formData
    .getAll("attachments")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  for (const file of files) {
    const validationError = getAttachmentValidationError(file);
    if (validationError) {
      throw new Error(validationError);
    }
  }

  const batchError = validateAttachmentFilesForUpload(files);
  if (batchError) {
    throw new Error(batchError);
  }

  return files;
}

export function parseAttachmentIdsToRemove(formData: FormData): string[] {
  const raw = formData.get("attachmentIdsToRemove");
  if (!raw) {
    return [];
  }

  return String(raw)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}
