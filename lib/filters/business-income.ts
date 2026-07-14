import type { BusinessIncomeTableRow } from "@/lib/business-income/types";
import type { SalaryBasis } from "@/lib/generated/prisma/client";

export type BusinessIncomeFilterValues = {
  name: string;
  incomeBasis: SalaryBasis | "";
};

export const EMPTY_BUSINESS_INCOME_FILTERS: BusinessIncomeFilterValues = {
  name: "",
  incomeBasis: "",
};

export function filterBusinessIncomes(
  items: BusinessIncomeTableRow[],
  filters: BusinessIncomeFilterValues,
) {
  const nameQuery = filters.name.trim();

  return items.filter((item) => {
    if (nameQuery && !item.name.includes(nameQuery)) return false;
    if (filters.incomeBasis && item.incomeBasis !== filters.incomeBasis) {
      return false;
    }
    return true;
  });
}
