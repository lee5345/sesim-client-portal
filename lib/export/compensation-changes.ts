import "server-only";

import { formatDate } from "@/lib/format/date";
import {
  buildStyledWorkbookBuffer,
  type StyledCell,
} from "@/lib/export/excel/workbook";
import type { SalaryBasis, SalaryType } from "@/lib/generated/prisma/client";
import {
  SALARY_BASIS_LABELS,
  SALARY_TYPE_LABELS,
} from "@/modules/hire-intakes/labels";

export type CompensationChangeExportRow = {
  name: string;
  changeDate: string;
  salaryTypeBefore: SalaryType;
  salaryBasisBefore: SalaryBasis;
  salaryAmountBefore: number;
  salaryTypeAfter: SalaryType;
  salaryBasisAfter: SalaryBasis;
  salaryAmountAfter: number;
  notes: string | null;
};

const HEADERS = [
  "이름",
  "급여변경일",
  "변경 전 급여 유형",
  "변경 전 급여 기준",
  "변경 전 급여 금액",
  "변경 후 급여 유형",
  "변경 후 급여 기준",
  "변경 후 급여 금액",
  "비고",
] as const;

function toRow(record: CompensationChangeExportRow): StyledCell[] {
  return [
    { value: record.name },
    { value: record.changeDate },
    { value: SALARY_TYPE_LABELS[record.salaryTypeBefore] },
    { value: SALARY_BASIS_LABELS[record.salaryBasisBefore] },
    { value: record.salaryAmountBefore },
    { value: SALARY_TYPE_LABELS[record.salaryTypeAfter] },
    { value: SALARY_BASIS_LABELS[record.salaryBasisAfter] },
    { value: record.salaryAmountAfter },
    { value: record.notes },
  ];
}

export function buildCompensationChangesExportBuffer(input: {
  title: string;
  companyName: string;
  exportedAt: Date;
  filterSummary: string;
  records: CompensationChangeExportRow[];
}) {
  return buildStyledWorkbookBuffer({
    sheetName: "급여변경 정보",
    title: input.title,
    subtitleLines: [
      `고객사: ${input.companyName}`,
      `생성일: ${formatDate(input.exportedAt)} · 조건: ${input.filterSummary} · ${input.records.length}건`,
    ],
    headers: [...HEADERS],
    rows: input.records.map(toRow),
    columnWidths: [12, 12, 12, 12, 14, 12, 12, 14, 24],
    centerHeaderIndexes: [1, 2, 3, 5, 6],
    numberColumnIndexes: [4, 7],
  });
}
