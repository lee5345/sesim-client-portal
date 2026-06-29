const MAX_FILENAME_LENGTH = 120;

export function sanitizeExportFilename(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) {
    throw new Error("파일 제목을 입력해 주세요.");
  }

  const sanitized = trimmed
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, " ")
    .trim();

  if (!sanitized) {
    throw new Error("유효한 파일 제목을 입력해 주세요.");
  }

  const base =
    sanitized.length > MAX_FILENAME_LENGTH
      ? sanitized.slice(0, MAX_FILENAME_LENGTH).trim()
      : sanitized;

  return base.toLowerCase().endsWith(".xlsx") ? base : `${base}.xlsx`;
}
