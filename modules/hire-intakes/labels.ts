import type { SalaryBasis, SalaryType } from "@/lib/generated/prisma/client";

export const SALARY_TYPE_LABELS: Record<SalaryType, string> = {
  ANNUAL: "연봉",
  MONTHLY: "월급",
  DAILY: "일급",
  HOURLY: "시급",
};

export const SALARY_BASIS_LABELS: Record<SalaryBasis, string> = {
  GROSS: "세전",
  NET: "세후",
};

export const SALARY_TYPES = Object.keys(SALARY_TYPE_LABELS) as SalaryType[];
export const SALARY_BASES = Object.keys(SALARY_BASIS_LABELS) as SalaryBasis[];
