import type { ExportFilterSummaryItem } from "@/lib/export/filter-summaries";

export type ExcelExportResult =
  | {
      success: true;
      data: string;
      filename: string;
      rowCount: number;
    }
  | { success: false; error: string };

export function compactFilterSummary(items: ExportFilterSummaryItem[]): string {
  const active = items.filter((item) => item.value !== "전체");
  if (active.length === 0) {
    return "전체";
  }
  return active.map((item) => `${item.label}: ${item.value}`).join(" · ");
}

export function toExportBase64(buffer: Buffer): string {
  return buffer.toString("base64");
}
