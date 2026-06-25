import type { DailyWorkerTableRow } from "@/lib/daily-workers/types";
import type { DailyWorkerOccupation, SalaryBasis } from "@/lib/generated/prisma/client";

export type DailyWorkerFilterValues = {
  name: string;
  occupation: DailyWorkerOccupation | "";
  salaryBasis: SalaryBasis | "";
};

export const EMPTY_DAILY_WORKER_FILTERS: DailyWorkerFilterValues = {
  name: "",
  occupation: "",
  salaryBasis: "",
};

export function filterDailyWorkers(
  items: DailyWorkerTableRow[],
  filters: DailyWorkerFilterValues,
) {
  const nameQuery = filters.name.trim();

  return items.filter((item) => {
    if (nameQuery && !item.name.includes(nameQuery)) return false;
    if (filters.occupation && item.occupation !== filters.occupation) return false;
    if (filters.salaryBasis && item.salaryBasis !== filters.salaryBasis) return false;
    return true;
  });
}

