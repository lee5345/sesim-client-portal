import type { HireIntakeFilterValues } from "@/components/hire-intakes/hire-intakes-filters";
import type { CompensationChangeFilterValues } from "@/lib/filters/compensation-changes";
import type { CompensationInfoFilterValues } from "@/lib/filters/compensation-info";
import type { DailyWorkerFilterValues } from "@/lib/filters/daily-workers";
import type { TerminationFilterValues } from "@/lib/filters/terminations";
import { SALARY_BASIS_LABELS } from "@/modules/hire-intakes/labels";
import { DAILY_WORKER_OCCUPATION_LABELS } from "@/modules/daily-workers/constants";
import { RETIREMENT_PAY_TYPE_LABELS } from "@/modules/terminations/constants";

export type ExportFilterSummaryItem = {
  label: string;
  value: string;
};

function formatDateRange(from: string, to: string, label: string): ExportFilterSummaryItem {
  if (!from && !to) {
    return { label, value: "전체" };
  }
  if (from && to) {
    return { label, value: `${from} ~ ${to}` };
  }
  if (from) {
    return { label, value: `${from} 이후` };
  }
  return { label, value: `${to} 이전` };
}

export function summarizeHireIntakeFilters(
  filters: HireIntakeFilterValues,
): ExportFilterSummaryItem[] {
  return [
    {
      label: "이름",
      value: filters.name.trim() ? filters.name.trim() : "전체",
    },
    formatDateRange(filters.hireDateFrom, filters.hireDateTo, "입사일"),
    {
      label: "부서",
      value:
        filters.departments.length > 0
          ? filters.departments.join(", ")
          : "전체",
    },
  ];
}

export function summarizeTerminationFilters(
  filters: TerminationFilterValues,
): ExportFilterSummaryItem[] {
  return [
    {
      label: "이름",
      value: filters.name.trim() ? filters.name.trim() : "전체",
    },
    formatDateRange(
      filters.terminationDateFrom,
      filters.terminationDateTo,
      "퇴사일",
    ),
    {
      label: "퇴직 급여",
      value:
        filters.retirementPayTypes.length > 0
          ? filters.retirementPayTypes
              .map((type) => RETIREMENT_PAY_TYPE_LABELS[type])
              .join(", ")
          : "전체",
    },
  ];
}

export function summarizeDailyWorkerFilters(
  year: number,
  month: number,
  filters: DailyWorkerFilterValues,
): ExportFilterSummaryItem[] {
  return [
    {
      label: "대상 기간",
      value: `${year}년 ${month}월`,
    },
    {
      label: "이름",
      value: filters.name.trim() ? filters.name.trim() : "전체",
    },
    {
      label: "직종",
      value:
        filters.occupations.length > 0
          ? filters.occupations
              .map((occupation) => DAILY_WORKER_OCCUPATION_LABELS[occupation])
              .join(", ")
          : "전체",
    },
    {
      label: "기준",
      value: filters.salaryBasis
        ? SALARY_BASIS_LABELS[filters.salaryBasis]
        : "전체",
    },
  ];
}

export function summarizeCompensationChangeFilters(
  filters: CompensationChangeFilterValues,
): ExportFilterSummaryItem[] {
  return [
    {
      label: "이름",
      value: filters.name.trim() ? filters.name.trim() : "전체",
    },
    formatDateRange(filters.changeDateFrom, filters.changeDateTo, "급여변경일"),
  ];
}

export function summarizeCompensationInfoFilters(
  year: number,
  month: number,
  filters: CompensationInfoFilterValues,
): ExportFilterSummaryItem[] {
  return [
    {
      label: "대상 기간",
      value: `${year}년 ${month}월`,
    },
    {
      label: "이름",
      value: filters.name.trim() ? filters.name.trim() : "전체",
    },
  ];
}
