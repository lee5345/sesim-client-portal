import "server-only";

import { formatDate } from "@/lib/format/date";
import { formatRrnForExport } from "@/lib/export/format-rrn";
import {
  buildStyledWorkbookBuffer,
  type StyledCell,
} from "@/lib/export/excel/workbook";
import type { RetirementPayType } from "@/lib/generated/prisma/client";
import { RETIREMENT_PAY_TYPE_LABELS } from "@/modules/terminations/constants";

export type TerminationExportRow = {
  name: string;
  rrn: string;
  hireDate: Date | null;
  terminationDate: Date;
  reason: string;
  retirementPayType: RetirementPayType;
  notes: string | null;
};

const HEADERS = [
  "이름",
  "주민등록번호",
  "입사일",
  "퇴사일",
  "퇴사 사유",
  "퇴직 급여",
  "비고",
] as const;

function toRow(record: TerminationExportRow): StyledCell[] {
  return [
    { value: record.name },
    { value: formatRrnForExport(record.rrn) },
    { value: record.hireDate ? formatDate(record.hireDate) : null },
    { value: formatDate(record.terminationDate) },
    { value: record.reason },
    { value: RETIREMENT_PAY_TYPE_LABELS[record.retirementPayType] },
    { value: record.notes },
  ];
}

export function buildTerminationsExportBuffer(input: {
  title: string;
  companyName: string;
  exportedAt: Date;
  filterSummary: string;
  records: TerminationExportRow[];
}) {
  return buildStyledWorkbookBuffer({
    sheetName: "퇴사자 정보",
    title: input.title,
    subtitleLines: [
      `고객사: ${input.companyName}`,
      `생성일: ${formatDate(input.exportedAt)} · 조건: ${input.filterSummary} · ${input.records.length}건`,
    ],
    headers: [...HEADERS],
    rows: input.records.map(toRow),
    columnWidths: [12, 16, 12, 12, 18, 12, 24],
    centerHeaderIndexes: [2, 3, 5],
    monoColumnIndexes: [1],
  });
}
