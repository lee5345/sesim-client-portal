import type { ExcelExportResult } from "@/lib/export/types";

export function downloadExcelExport(result: Extract<ExcelExportResult, { success: true }>) {
  const bytes = Uint8Array.from(atob(result.data), (char) => char.charCodeAt(0));
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = result.filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
