import type { DailyWorkerOccupation } from "@/lib/generated/prisma/client";

export const DAILY_WORKER_OCCUPATIONS = [
  {
    value: "MEDICAL_DOCTOR" as const,
    label: "의사, 한의사 및 치과의사",
    code: "301",
  },
  {
    value: "VETERINARIAN" as const,
    label: "수의사",
    code: "302",
  },
  {
    value: "PHARMACIST" as const,
    label: "약사 및 한약사",
    code: "303",
  },
  {
    value: "NURSE" as const,
    label: "간호사",
    code: "304",
  },
  {
    value: "NUTRITIONIST" as const,
    label: "영양사",
    code: "305",
  },
  {
    value: "MEDICAL_TECHNICIAN" as const,
    label: "의료기사, 치료사, 재활사",
    code: "306",
  },
  {
    value: "HEALTHCARE_WORKER" as const,
    label: "보건, 의료 종사자",
    code: "307",
  },
] as const;

export type DailyWorkerOccupationValue =
  (typeof DAILY_WORKER_OCCUPATIONS)[number]["value"];

export const DAILY_WORKER_OCCUPATION_VALUES = DAILY_WORKER_OCCUPATIONS.map(
  (item) => item.value,
);

export const DAILY_WORKER_OCCUPATION_LABELS: Record<
  DailyWorkerOccupation,
  string
> = Object.fromEntries(
  DAILY_WORKER_OCCUPATIONS.map((item) => [item.value, item.label]),
) as Record<DailyWorkerOccupation, string>;

export const DAILY_WORKER_OCCUPATION_CODES: Record<
  DailyWorkerOccupation,
  string
> = Object.fromEntries(
  DAILY_WORKER_OCCUPATIONS.map((item) => [item.value, item.code]),
) as Record<DailyWorkerOccupation, string>;

export const DAILY_HOUR_DAY_COUNT = 31;

export const DAILY_HOUR_FIELD_NAMES = Array.from(
  { length: DAILY_HOUR_DAY_COUNT },
  (_, index) => `hoursDay${index + 1}` as const,
);

export type DailyHourFieldName = (typeof DAILY_HOUR_FIELD_NAMES)[number];

export function isDailyWorkerOccupation(
  value: string,
): value is DailyWorkerOccupation {
  return DAILY_WORKER_OCCUPATION_VALUES.includes(
    value as DailyWorkerOccupationValue,
  );
}

export function getOccupationCode(occupation: DailyWorkerOccupation): string {
  return DAILY_WORKER_OCCUPATION_CODES[occupation];
}
