export type DependentFilterValues = {
  name: string;
  registrationDateFrom: string;
  registrationDateTo: string;
};

export const EMPTY_DEPENDENT_FILTERS: DependentFilterValues = {
  name: "",
  registrationDateFrom: "",
  registrationDateTo: "",
};

function isFullIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function includesNormalized(haystack: string, needle: string) {
  const h = haystack.trim().toLowerCase();
  const n = needle.trim().toLowerCase();
  return n ? h.includes(n) : true;
}

export function filterDependents<
  T extends {
    employeeName: string;
    registrationRequestedDate: string;
  },
>(items: T[], filters: DependentFilterValues): T[] {
  const from = isFullIsoDate(filters.registrationDateFrom)
    ? filters.registrationDateFrom
    : "";
  const to = isFullIsoDate(filters.registrationDateTo)
    ? filters.registrationDateTo
    : "";

  return items.filter((row) => {
    if (!includesNormalized(row.employeeName, filters.name)) {
      return false;
    }

    if (from && row.registrationRequestedDate < from) {
      return false;
    }

    if (to && row.registrationRequestedDate > to) {
      return false;
    }

    return true;
  });
}
