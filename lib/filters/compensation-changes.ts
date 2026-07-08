export type CompensationChangeFilterValues = {
  name: string;
  changeDateFrom: string;
  changeDateTo: string;
};

export const EMPTY_COMPENSATION_CHANGE_FILTERS: CompensationChangeFilterValues = {
  name: "",
  changeDateFrom: "",
  changeDateTo: "",
};

function isFullIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function includesNormalized(haystack: string, needle: string) {
  const h = haystack.trim().toLowerCase();
  const n = needle.trim().toLowerCase();
  return n ? h.includes(n) : true;
}

export function filterCompensationChanges<T extends { name: string; changeDate: string }>(
  items: T[],
  filters: CompensationChangeFilterValues,
): T[] {
  const from = isFullIsoDate(filters.changeDateFrom) ? filters.changeDateFrom : "";
  const to = isFullIsoDate(filters.changeDateTo) ? filters.changeDateTo : "";

  return items.filter((row) => {
    if (!includesNormalized(row.name, filters.name)) {
      return false;
    }
    if (from && row.changeDate < from) {
      return false;
    }
    if (to && row.changeDate > to) {
      return false;
    }
    return true;
  });
}

