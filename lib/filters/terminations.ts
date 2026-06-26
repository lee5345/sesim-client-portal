import type { RetirementPayType } from "@/lib/generated/prisma/client";
import type { TerminationTableRow } from "@/lib/terminations/types";

export type TerminationFilterValues = {
  name: string;
  terminationDateFrom: string;
  terminationDateTo: string;
  retirementPayTypes: RetirementPayType[];
};

export const EMPTY_TERMINATION_FILTERS: TerminationFilterValues = {
  name: "",
  terminationDateFrom: "",
  terminationDateTo: "",
  retirementPayTypes: [],
};

function parseFilterDate(value: string, endOfDay = false) {
  if (!value.trim()) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  }

  return date;
}

export function filterTerminations(
  terminations: TerminationTableRow[],
  filters: TerminationFilterValues,
) {
  const nameQuery = filters.name.trim().toLowerCase();
  const terminationDateFrom = parseFilterDate(filters.terminationDateFrom);
  const terminationDateTo = parseFilterDate(filters.terminationDateTo, true);
  const selectedRetirementPayTypes = new Set(filters.retirementPayTypes);

  return terminations.filter((termination) => {
    if (nameQuery && !termination.name.toLowerCase().includes(nameQuery)) {
      return false;
    }

    if (terminationDateFrom && termination.terminationDate < terminationDateFrom) {
      return false;
    }

    if (terminationDateTo && termination.terminationDate > terminationDateTo) {
      return false;
    }

    if (
      selectedRetirementPayTypes.size > 0 &&
      !selectedRetirementPayTypes.has(termination.retirementPayType)
    ) {
      return false;
    }

    return true;
  });
}
