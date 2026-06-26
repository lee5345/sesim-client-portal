import type { DailyWorkerTableRow } from "@/lib/daily-workers/types";
import type { DailyWorkerOccupation, SalaryBasis } from "@/lib/generated/prisma/client";

export type DailyWorkerFilterValues = {
  name: string;
  occupations: DailyWorkerOccupation[];
  salaryBasis: SalaryBasis | "";
};

export const EMPTY_DAILY_WORKER_FILTERS: DailyWorkerFilterValues = {
  name: "",
  occupations: [],
  salaryBasis: "",
};

export function filterDailyWorkers(
  items: DailyWorkerTableRow[],
  filters: DailyWorkerFilterValues,
) {
  const nameQuery = filters.name.trim();
  const selectedOccupations = new Set(filters.occupations);

  return items.filter((item) => {
    if (nameQuery && !item.name.includes(nameQuery)) return false;
    if (
      selectedOccupations.size > 0 &&
      !selectedOccupations.has(item.occupation)
    ) {
      return false;
    }
    if (filters.salaryBasis && item.salaryBasis !== filters.salaryBasis) return false;
    return true;
  });
}

