import { formatKstDateKey } from "@/lib/datetime/kst";

export type OfficeTaskFilterValues = {
  query: string;
  companyIds: string[];
  completedFrom: string;
  completedTo: string;
};

export const EMPTY_OFFICE_TASK_FILTERS: OfficeTaskFilterValues = {
  query: "",
  companyIds: [],
  completedFrom: "",
  completedTo: "",
};

function isFullIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function includesNormalized(haystack: string, needle: string) {
  const h = haystack.trim().toLowerCase();
  const n = needle.trim().toLowerCase();
  return n ? h.includes(n) : true;
}

function matchesDateRange(
  isoTimestamp: string | null,
  from: string,
  to: string,
): boolean {
  if (!isoTimestamp) {
    return false;
  }

  const dateKey = formatKstDateKey(new Date(isoTimestamp));
  const filterFrom = isFullIsoDate(from) ? from : "";
  const filterTo = isFullIsoDate(to) ? to : "";

  if (filterFrom && dateKey < filterFrom) {
    return false;
  }

  if (filterTo && dateKey > filterTo) {
    return false;
  }

  return true;
}

export function filterCompletedOfficeTasks<
  T extends {
    title: string;
    description: string | null;
    company: { id: string } | null;
    completedAtIso: string | null;
  },
>(items: T[], filters: OfficeTaskFilterValues): T[] {
  const companySet = new Set(filters.companyIds);

  return items.filter((row) => {
    const searchable = `${row.title}\n${row.description ?? ""}`;

    if (!includesNormalized(searchable, filters.query)) {
      return false;
    }

    if (companySet.size > 0) {
      if (!row.company || !companySet.has(row.company.id)) {
        return false;
      }
    }

    if (
      filters.completedFrom ||
      filters.completedTo
    ) {
      if (
        !matchesDateRange(
          row.completedAtIso,
          filters.completedFrom,
          filters.completedTo,
        )
      ) {
        return false;
      }
    }

    return true;
  });
}
