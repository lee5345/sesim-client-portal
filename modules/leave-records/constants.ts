import type { LeaveType } from "@/lib/generated/prisma/client";

export const LEAVE_TYPES = [
  "MATERNITY_LEAVE",
  "SPOUSE_MATERNITY_LEAVE",
  "PRENATAL_PARENTAL_LEAVE",
  "GENERAL_PARENTAL_LEAVE",
  "CHILD_CARE_WORK_HOUR_REDUCTION",
  "PREGNANCY_WORK_HOUR_REDUCTION",
  "MISCARRIAGE_STILLBIRTH_LEAVE",
] as const satisfies readonly LeaveType[];

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  MATERNITY_LEAVE: "출산전후휴가",
  SPOUSE_MATERNITY_LEAVE: "배우자출산휴가",
  PRENATAL_PARENTAL_LEAVE: "산전육아휴직",
  GENERAL_PARENTAL_LEAVE: "일반육아휴직",
  CHILD_CARE_WORK_HOUR_REDUCTION: "육아기근로시간단축",
  PREGNANCY_WORK_HOUR_REDUCTION: "임신기근로시간단축",
  MISCARRIAGE_STILLBIRTH_LEAVE: "유사산휴가",
};

const DELIVERY_DATE_TYPES = new Set<LeaveType>([
  "MATERNITY_LEAVE",
  "SPOUSE_MATERNITY_LEAVE",
  "PRENATAL_PARENTAL_LEAVE",
  "GENERAL_PARENTAL_LEAVE",
]);

const CHILD_INFO_TYPES = new Set<LeaveType>([
  "GENERAL_PARENTAL_LEAVE",
  "CHILD_CARE_WORK_HOUR_REDUCTION",
]);

const HOUR_REDUCTION_TYPES = new Set<LeaveType>([
  "PREGNANCY_WORK_HOUR_REDUCTION",
  "CHILD_CARE_WORK_HOUR_REDUCTION",
]);

export function requiresExpectedDeliveryDate(leaveType: LeaveType): boolean {
  return DELIVERY_DATE_TYPES.has(leaveType);
}

export function requiresChildInfo(leaveType: LeaveType): boolean {
  return CHILD_INFO_TYPES.has(leaveType);
}

export function requiresHourReduction(leaveType: LeaveType): boolean {
  return HOUR_REDUCTION_TYPES.has(leaveType);
}

export function formatWeeklyHours(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }

  const rounded = Math.round(value * 10) / 10;
  const formatted = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `주 ${formatted}시간`;
}
