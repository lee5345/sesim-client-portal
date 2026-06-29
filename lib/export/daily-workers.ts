import "server-only";

import {
  formatDailyHourDayLabel,
  formatDailyHours,
  getDailyHourDayNumbers,
} from "@/lib/daily-workers/calculations";
import type { DailyHoursInput } from "@/lib/daily-workers/calculations";
import { formatDate } from "@/lib/format/date";
import { formatRrnForExport } from "@/lib/export/format-rrn";
import {
  buildStyledWorkbookBuffer,
  type StyledCell,
} from "@/lib/export/excel/workbook";
import type { DailyWorkerOccupation, SalaryBasis } from "@/lib/generated/prisma/client";
import { DAILY_WORKER_OCCUPATION_LABELS } from "@/modules/daily-workers/constants";
import { SALARY_BASIS_LABELS } from "@/modules/hire-intakes/labels";

export type DailyWorkerExportRow = {
  name: string;
  rrn: string;
  occupation: DailyWorkerOccupation;
  occupationCode: string;
  hours: DailyHoursInput;
  daysWorked: number;
  avgHoursPerDay: number;
  salaryBasis: SalaryBasis;
  totalWage: number;
  notes: string | null;
};

function toRow(record: DailyWorkerExportRow): StyledCell[] {
  const dayNumbers = getDailyHourDayNumbers();
  const dayCells: StyledCell[] = dayNumbers.map((day) => {
    const fieldName = `hoursDay${day}` as const;
    const value = record.hours[fieldName];
    return {
      value: value === null ? null : formatDailyHours(value),
    };
  });

  return [
    { value: record.name },
    { value: formatRrnForExport(record.rrn) },
    { value: DAILY_WORKER_OCCUPATION_LABELS[record.occupation] },
    { value: record.occupationCode },
    ...dayCells,
    { value: record.daysWorked },
    { value: record.avgHoursPerDay },
    { value: SALARY_BASIS_LABELS[record.salaryBasis] },
    { value: record.totalWage },
    { value: record.notes },
  ];
}

export function buildDailyWorkersExportBuffer(input: {
  title: string;
  companyName: string;
  year: number;
  month: number;
  exportedAt: Date;
  filterSummary: string;
  records: DailyWorkerExportRow[];
}) {
  const dayNumbers = getDailyHourDayNumbers();
  const dayHeaders = dayNumbers.map((day) => formatDailyHourDayLabel(day));
  const headers = [
    "이름",
    "주민등록번호",
    "직종",
    "직종코드",
    ...dayHeaders,
    "근로일수",
    "일평균 근로시간",
    "기준",
    "임금총액",
    "비고",
  ];

  const dayStartIndex = 4;
  const dayEndIndex = dayStartIndex + dayNumbers.length - 1;
  const centerHeaderIndexes = [
    ...Array.from({ length: dayNumbers.length }, (_, index) => dayStartIndex + index),
    dayEndIndex + 1,
    dayEndIndex + 2,
    dayEndIndex + 3,
  ];
  const accentColumnIndexes = [
    dayEndIndex + 1,
    dayEndIndex + 2,
  ];
  const numberColumnIndexes = [dayEndIndex + 4];
  const monoColumnIndexes = [1, 3];

  return buildStyledWorkbookBuffer({
    sheetName: `${input.month}월 일용직`,
    title: input.title,
    subtitleLines: [
      `고객사: ${input.companyName} · ${input.year}년 ${input.month}월`,
      `생성일: ${formatDate(input.exportedAt)} · 조건: ${input.filterSummary} · ${input.records.length}건`,
    ],
    headers,
    rows: input.records.map(toRow),
    columnWidths: [
      12,
      16,
      22,
      10,
      ...dayNumbers.map(() => 5),
      10,
      14,
      8,
      14,
      20,
    ],
    centerHeaderIndexes,
    accentColumnIndexes,
    numberColumnIndexes,
    monoColumnIndexes,
  });
}
