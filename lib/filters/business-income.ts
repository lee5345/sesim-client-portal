import type { BusinessIncomeTableRow } from "@/lib/business-income/types";

export type BusinessIncomeFilterValues = {
  name: string;
};

export const EMPTY_BUSINESS_INCOME_FILTERS: BusinessIncomeFilterValues = {
  name: "",
};

export function filterBusinessIncomes(
  items: BusinessIncomeTableRow[],
  filters: BusinessIncomeFilterValues,
) {
  const nameQuery = filters.name.trim();

  return items.filter((item) => {
    if (nameQuery && !item.name.includes(nameQuery)) return false;
    return true;
  });
}
