import { formatSalaryAmount } from "@/lib/format/currency";
import { formatDate, formatYearMonth } from "@/lib/format/date";
import {
  formatWeeklyHours,
  LEAVE_TYPE_LABELS,
} from "@/modules/leave-records/constants";
import { DAILY_WORKER_OCCUPATION_LABELS } from "@/modules/daily-workers/constants";
import {
  SALARY_BASIS_LABELS,
  SALARY_TYPE_LABELS,
} from "@/modules/hire-intakes/labels";
import { RETIREMENT_PAY_TYPE_LABELS } from "@/modules/terminations/constants";
import type { NonTaxableAllowance } from "@/lib/validation/hire-intake";
import type {
  DailyWorkerOccupation,
  LeaveType,
  RetirementPayType,
  SalaryBasis,
  SalaryType,
} from "@/lib/generated/prisma/client";

const EMPTY_CELL = "—";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T/;

export type AuditPayloadRow = {
  key: string;
  label: string;
  value: string;
};

const FIELD_LABELS: Record<string, string> = {
  name: "이름",
  employeeName: "직원 이름",
  dependentName: "피부양자 이름",
  employeeNumber: "사번",
  email: "이메일",
  phone: "연락처",
  hireDate: "입사일",
  terminationDate: "퇴사일",
  changeDate: "급여변경일",
  registrationRequestedDate: "등록 희망일",
  department: "부서",
  salaryType: "급여 유형",
  salaryBasis: "급여 기준",
  salaryAmount: "급여액",
  isContract: "계약직",
  contractStart: "계약 시작일",
  contractEnd: "계약 종료일",
  nonTaxableAllowances: "비과세 항목",
  bankName: "은행",
  accountNumber: "계좌번호",
  notes: "비고",
  reason: "퇴사 사유",
  retirementPayType: "퇴직 급여",
  relationship: "관계",
  year: "연도",
  month: "월",
  occupation: "직종",
  occupationCode: "직종코드",
  daysWorked: "근로일수",
  avgHoursPerDay: "일평균 근로시간",
  totalWage: "임금총액",
  salaryTypeBefore: "변경 전 급여 유형",
  salaryBasisBefore: "변경 전 급여 기준",
  salaryAmountBefore: "변경 전 급여액",
  salaryTypeAfter: "변경 후 급여 유형",
  salaryBasisAfter: "변경 후 급여 기준",
  salaryAmountAfter: "변경 후 급여액",
  overtimeHours: "연장근로",
  holidayHours: "휴일근로",
  nightHours: "야간근로",
  absenceDays: "결근",
  lateEarlyLeaveHours: "지각 및 조퇴",
  incentiveAmount: "인센티브",
  incentiveBasis: "인센티브 기준",
  unusedLeaveUnit: "미사용연차 단위",
  unusedLeaveAmount: "미사용연차 값",
  incomeAmount: "소득액",
  incomeBasis: "소득 기준",
  leaveType: "종류",
  periodStart: "시작일",
  periodEnd: "종료일",
  expectedDeliveryDate: "출산(예정)일",
  childName: "대상자녀 이름",
  hoursBeforeReduction: "단축 전 근로시간",
  hoursAfterReduction: "단축 후 근로시간",
  salaryBeforeReduction: "단축 전 급여",
  salaryAfterReduction: "단축 후 급여",
  mode: "복사 방식",
  targetYear: "대상 연도",
  targetMonth: "대상 월",
  sourceYear: "원본 연도",
  sourceMonth: "원본 월",
  created: "등록 건수",
  skipped: "건너뛴 건수",
};

const FIELD_ORDER = Object.keys(FIELD_LABELS);

const MONEY_KEYS = new Set([
  "salaryAmount",
  "salaryAmountBefore",
  "salaryAmountAfter",
  "totalWage",
  "incentiveAmount",
  "incomeAmount",
  "salaryBeforeReduction",
  "salaryAfterReduction",
]);

const DATE_KEYS = new Set([
  "hireDate",
  "terminationDate",
  "changeDate",
  "registrationRequestedDate",
  "contractStart",
  "contractEnd",
  "periodStart",
  "periodEnd",
  "expectedDeliveryDate",
]);

const UNUSED_LEAVE_UNIT_LABELS: Record<string, string> = {
  DAYS: "일",
  HOURS: "시간",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatIsoDateValue(value: string): string | null {
  if (!ISO_DATE_RE.test(value)) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return formatDate(date);
}

function formatNonTaxableAllowances(value: unknown): string {
  if (!Array.isArray(value) || value.length === 0) {
    return EMPTY_CELL;
  }

  return value
    .map((item) => {
      if (!isRecord(item)) {
        return null;
      }
      const allowance = item as Partial<NonTaxableAllowance>;
      const type = typeof allowance.type === "string" ? allowance.type : null;
      if (!type) {
        return null;
      }
      const label =
        type === "기타" && typeof allowance.customLabel === "string"
          ? allowance.customLabel
          : type;
      const amount =
        typeof allowance.amount === "number"
          ? formatSalaryAmount(allowance.amount)
          : null;
      return amount ? `${label} ${amount}` : label;
    })
    .filter((part): part is string => Boolean(part))
    .join(", ");
}

function formatEnumValue(key: string, value: string): string | null {
  if (key === "salaryType" || key.startsWith("salaryType")) {
    return SALARY_TYPE_LABELS[value as SalaryType] ?? null;
  }
  if (
    key === "salaryBasis" ||
    key === "incomeBasis" ||
    key === "incentiveBasis" ||
    key.startsWith("salaryBasis")
  ) {
    return SALARY_BASIS_LABELS[value as SalaryBasis] ?? null;
  }
  if (key === "retirementPayType") {
    return RETIREMENT_PAY_TYPE_LABELS[value as RetirementPayType] ?? null;
  }
  if (key === "occupation") {
    return DAILY_WORKER_OCCUPATION_LABELS[value as DailyWorkerOccupation] ?? null;
  }
  if (key === "leaveType") {
    return LEAVE_TYPE_LABELS[value as LeaveType] ?? null;
  }
  if (key === "unusedLeaveUnit") {
    return UNUSED_LEAVE_UNIT_LABELS[value] ?? null;
  }
  if (key === "mode") {
    if (value === "overwrite") return "덮어쓰기";
    if (value === "append") return "추가하기";
    return value;
  }
  return null;
}

function formatScalarValue(key: string, value: unknown): string {
  if (value === null || value === undefined) {
    return EMPTY_CELL;
  }

  if (typeof value === "boolean") {
    if (key === "isContract") {
      return value ? "계약직" : "해당 없음";
    }
    return value ? "예" : "아니오";
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return EMPTY_CELL;
    }
    if (MONEY_KEYS.has(key)) {
      return formatSalaryAmount(value);
    }
    if (key === "hoursBeforeReduction" || key === "hoursAfterReduction") {
      return formatWeeklyHours(value);
    }
    if (key === "avgHoursPerDay") {
      const rounded = Math.round(value * 100) / 100;
      return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
    }
    return String(value);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return EMPTY_CELL;
    }
    if (DATE_KEYS.has(key) || ISO_DATE_RE.test(trimmed)) {
      return formatIsoDateValue(trimmed) ?? trimmed;
    }
    return formatEnumValue(key, trimmed) ?? trimmed;
  }

  if (key === "nonTaxableAllowances") {
    return formatNonTaxableAllowances(value);
  }

  if (Array.isArray(value) || isRecord(value)) {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
}

function getFieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? key;
}

function compareFieldKeys(a: string, b: string): number {
  const aIndex = FIELD_ORDER.indexOf(a);
  const bIndex = FIELD_ORDER.indexOf(b);
  const aRank = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
  const bRank = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;
  if (aRank !== bRank) {
    return aRank - bRank;
  }
  return a.localeCompare(b);
}

/** Flattens year+month into a single 귀속연월 row when both are present. */
function mergeYearMonthRows(
  entries: Array<[string, unknown]>,
): Array<[string, unknown]> {
  const yearEntry = entries.find(([key]) => key === "year");
  const monthEntry = entries.find(([key]) => key === "month");
  if (
    !yearEntry ||
    !monthEntry ||
    typeof yearEntry[1] !== "number" ||
    typeof monthEntry[1] !== "number"
  ) {
    return entries;
  }

  const rest = entries.filter(([key]) => key !== "year" && key !== "month");
  return [
    ["period", formatYearMonth(yearEntry[1], monthEntry[1])],
    ...rest,
  ];
}

const MERGED_FIELD_LABELS: Record<string, string> = {
  period: "귀속연월",
};

/**
 * Parses an audit log JSON payload into labeled rows for the detail dialog.
 */
export function parseAuditPayloadRows(payload: unknown): AuditPayloadRow[] {
  if (payload === null || payload === undefined) {
    return [];
  }

  if (!isRecord(payload)) {
    return [
      {
        key: "value",
        label: "내용",
        value: formatScalarValue("value", payload),
      },
    ];
  }

  const entries = mergeYearMonthRows(Object.entries(payload)).sort(([a], [b]) =>
    compareFieldKeys(a === "period" ? "year" : a, b === "period" ? "year" : b),
  );

  return entries.map(([key, value]) => ({
    key,
    label: MERGED_FIELD_LABELS[key] ?? getFieldLabel(key),
    value: key === "period" ? String(value) : formatScalarValue(key, value),
  }));
}

const PREFERRED_PREVIEW_KEYS = [
  "name",
  "employeeName",
  "email",
  "employeeNumber",
  "phone",
  "period",
  "mode",
  "created",
  "skipped",
] as const;

/**
 * Compact one-line Korean summary of an audit payload for table cells.
 * Uses the same value formatting as the detail dialog.
 * Visual truncation with `...` is handled by the table cell layout.
 */
export function summarizeAuditPayload(payload: unknown): string {
  const rows = parseAuditPayloadRows(payload);
  if (rows.length === 0) {
    return EMPTY_CELL;
  }

  const preferred = new Set<string>(PREFERRED_PREVIEW_KEYS);
  const values: string[] = [];
  const seen = new Set<string>();

  for (const key of PREFERRED_PREVIEW_KEYS) {
    const row = rows.find((item) => item.key === key);
    if (!row || row.value === EMPTY_CELL) continue;
    values.push(row.value);
    seen.add(row.key);
  }

  for (const row of rows) {
    if (seen.has(row.key) || preferred.has(row.key)) continue;
    if (row.value === EMPTY_CELL) continue;
    values.push(row.value);
  }

  if (values.length === 0) {
    return EMPTY_CELL;
  }

  return values.join(", ");
}

/** Full Korean searchable text (labels + formatted values) for a payload. */
export function getAuditPayloadSearchText(payload: unknown): string {
  return parseAuditPayloadRows(payload)
    .flatMap((row) => [row.label, row.value])
    .filter((part) => part && part !== EMPTY_CELL)
    .join(" ");
}

/**
 * True when the query matches Korean-formatted payload content
 * (and/or the raw JSON, so English enum codes still work).
 */
export function auditPayloadMatchesQuery(
  payload: unknown,
  query: string,
): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  if (getAuditPayloadSearchText(payload).toLowerCase().includes(normalized)) {
    return true;
  }

  try {
    return JSON.stringify(payload).toLowerCase().includes(normalized);
  } catch {
    return false;
  }
}
