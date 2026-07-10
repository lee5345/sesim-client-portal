import "server-only";

import { formatDecimalHours } from "@/lib/compensation-info/format";
import { formatDate } from "@/lib/format/date";
import {
  buildStyledWorkbookBuffer,
  type StyledCell,
} from "@/lib/export/excel/workbook";
import type { SalaryBasis, UnusedLeaveUnit } from "@/lib/generated/prisma/client";
import { SALARY_BASIS_LABELS } from "@/modules/hire-intakes/labels";

export type CompensationInfoExportRow = {
  name: string;
  overtimeHours: number | null;
  holidayHours: number | null;
  nightHours: number | null;
  absenceDays: number | null;
  lateEarlyLeaveHours: number | null;
  incentiveBasis: SalaryBasis | null;
  incentiveAmount: number | null;
  unusedLeaveUnit: UnusedLeaveUnit | null;
  unusedLeaveAmount: number | null;
  notes: string | null;
};

const HEADERS = [
  "이름",
  "연장근로",
  "휴일근로",
  "야간근로",
  "결근",
  "지각 및 조퇴",
  "인센티브 기준",
  "인센티브 금액",
  "미사용연차 단위",
  "미사용연차 값",
  "비고",
] as const;

function formatHourValue(value: number | null): string | null {
  if (value === null) {
    return null;
  }
  return formatDecimalHours(value);
}

function formatIncentiveBasis(basis: SalaryBasis | null): string | null {
  if (!basis) {
    return null;
  }
  return SALARY_BASIS_LABELS[basis];
}

function formatUnusedLeaveUnit(unit: UnusedLeaveUnit | null): string | null {
  if (unit === "DAYS") {
    return "일";
  }
  if (unit === "HOURS") {
    return "시간";
  }
  return null;
}

function formatUnusedLeaveValue(
  unit: UnusedLeaveUnit | null,
  amount: number | null,
): string | number | null {
  if (!unit || amount === null) {
    return null;
  }
  if (unit === "DAYS") {
    return amount;
  }
  return Math.round(amount * 10) / 10;
}

function toRow(record: CompensationInfoExportRow): StyledCell[] {
  return [
    { value: record.name },
    { value: formatHourValue(record.overtimeHours) },
    { value: formatHourValue(record.holidayHours) },
    { value: formatHourValue(record.nightHours) },
    { value: record.absenceDays },
    { value: formatHourValue(record.lateEarlyLeaveHours) },
    { value: formatIncentiveBasis(record.incentiveBasis) },
    { value: record.incentiveAmount },
    { value: formatUnusedLeaveUnit(record.unusedLeaveUnit) },
    {
      value: formatUnusedLeaveValue(
        record.unusedLeaveUnit,
        record.unusedLeaveAmount,
      ),
    },
    { value: record.notes },
  ];
}

export function buildCompensationInfoExportBuffer(input: {
  title: string;
  companyName: string;
  year: number;
  month: number;
  exportedAt: Date;
  filterSummary: string;
  records: CompensationInfoExportRow[];
}) {
  return buildStyledWorkbookBuffer({
    sheetName: `${input.month}월 상세급여`,
    title: input.title,
    subtitleLines: [
      `고객사: ${input.companyName} · ${input.year}년 ${input.month}월`,
      `생성일: ${formatDate(input.exportedAt)} · 조건: ${input.filterSummary} · ${input.records.length}건`,
    ],
    headers: [...HEADERS],
    rows: input.records.map(toRow),
    columnWidths: [12, 10, 10, 10, 8, 12, 10, 14, 12, 12, 24],
    centerHeaderIndexes: [1, 2, 3, 4, 5, 6, 8, 9],
    numberColumnIndexes: [4, 7, 9],
  });
}
