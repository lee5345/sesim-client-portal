import "server-only";

import { formatDate } from "@/lib/format/date";
import { formatRrnForExport } from "@/lib/export/format-rrn";
import {
  buildStyledWorkbookBuffer,
  type StyledCell,
} from "@/lib/export/excel/workbook";
import type { SalaryBasis } from "@/lib/generated/prisma/client";
import { SALARY_BASIS_LABELS } from "@/modules/hire-intakes/labels";

export type BusinessIncomeExportRow = {
  name: string;
  rrn: string;
  incomeAmount: number;
  incomeBasis: SalaryBasis;
  notes: string | null;
};

const HEADERS = [
  "이름",
  "주민등록번호",
  "소득액",
  "기준",
  "비고",
] as const;

function toRow(record: BusinessIncomeExportRow): StyledCell[] {
  return [
    { value: record.name },
    { value: formatRrnForExport(record.rrn) },
    { value: record.incomeAmount },
    { value: SALARY_BASIS_LABELS[record.incomeBasis] },
    { value: record.notes },
  ];
}

export function buildBusinessIncomeExportBuffer(input: {
  title: string;
  companyName: string;
  year: number;
  month: number;
  exportedAt: Date;
  filterSummary: string;
  records: BusinessIncomeExportRow[];
}) {
  return buildStyledWorkbookBuffer({
    sheetName: `${input.month}월 사업소득`,
    title: input.title,
    subtitleLines: [
      `고객사: ${input.companyName} · ${input.year}년 ${input.month}월`,
      `생성일: ${formatDate(input.exportedAt)} · 조건: ${input.filterSummary} · ${input.records.length}건`,
    ],
    headers: [...HEADERS],
    rows: input.records.map(toRow),
    columnWidths: [12, 16, 14, 10, 24],
    centerHeaderIndexes: [2, 3],
    numberColumnIndexes: [2],
  });
}
