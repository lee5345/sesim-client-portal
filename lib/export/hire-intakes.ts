import "server-only";

import { formatDate } from "@/lib/format/date";
import { formatPhone } from "@/lib/format/phone";
import { formatRrnForExport } from "@/lib/export/format-rrn";
import {
  buildStyledWorkbookBuffer,
  type StyledCell,
} from "@/lib/export/excel/workbook";
import type { NonTaxableAllowance } from "@/lib/validation/hire-intake";
import {
  SALARY_BASIS_LABELS,
  SALARY_TYPE_LABELS,
} from "@/modules/hire-intakes/labels";

export type HireIntakeExportRow = {
  name: string;
  rrn: string;
  hireDate: Date;
  department: string | null;
  salaryType: keyof typeof SALARY_TYPE_LABELS;
  salaryBasis: keyof typeof SALARY_BASIS_LABELS;
  salaryAmount: number;
  isContract: boolean;
  contractStart: Date | null;
  contractEnd: Date | null;
  nonTaxableAllowances: NonTaxableAllowance[] | null;
  bankName: string | null;
  accountNumber: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
};

const HEADERS = [
  "이름",
  "주민등록번호",
  "입사일",
  "부서",
  "급여 유형",
  "급여 기준",
  "급여 금액",
  "고용 형태",
  "계약 시작일",
  "계약 종료일",
  "비과세 항목",
  "은행",
  "계좌번호",
  "이메일",
  "연락처",
  "비고",
] as const;

function formatAllowances(allowances: NonTaxableAllowance[] | null) {
  if (!allowances?.length) {
    return null;
  }

  return allowances
    .map((allowance) => {
      const label =
        allowance.type === "기타" && allowance.customLabel
          ? allowance.customLabel
          : allowance.type;
      return `${label} ${allowance.amount.toLocaleString("ko-KR")}원`;
    })
    .join(", ");
}

function toRow(record: HireIntakeExportRow): StyledCell[] {
  return [
    { value: record.name },
    { value: formatRrnForExport(record.rrn) },
    { value: formatDate(record.hireDate) },
    { value: record.department },
    { value: SALARY_TYPE_LABELS[record.salaryType] },
    { value: SALARY_BASIS_LABELS[record.salaryBasis] },
    { value: record.salaryAmount },
    { value: record.isContract ? "계약직" : "정규직" },
    {
      value:
        record.isContract && record.contractStart
          ? formatDate(record.contractStart)
          : null,
    },
    {
      value:
        record.isContract && record.contractEnd
          ? formatDate(record.contractEnd)
          : null,
    },
    { value: formatAllowances(record.nonTaxableAllowances) },
    { value: record.bankName },
    { value: record.accountNumber },
    { value: record.email },
    { value: record.phone ? formatPhone(record.phone) : null },
    { value: record.notes },
  ];
}

export function buildHireIntakesExportBuffer(input: {
  title: string;
  companyName: string;
  exportedAt: Date;
  filterSummary: string;
  records: HireIntakeExportRow[];
}) {
  return buildStyledWorkbookBuffer({
    sheetName: "입사자 정보",
    title: input.title,
    subtitleLines: [
      `고객사: ${input.companyName}`,
      `생성일: ${formatDate(input.exportedAt)} · 조건: ${input.filterSummary} · ${input.records.length}건`,
    ],
    headers: [...HEADERS],
    rows: input.records.map(toRow),
    columnWidths: [12, 16, 12, 14, 10, 10, 14, 10, 12, 12, 28, 12, 18, 22, 14, 24],
    centerHeaderIndexes: [4, 5, 7, 8, 9],
    monoColumnIndexes: [1, 12],
    numberColumnIndexes: [6],
  });
}
