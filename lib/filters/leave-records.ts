import type { LeaveType } from "@/lib/generated/prisma/client";

export type LeaveRecordFilterValues = {
  name: string;
  leaveTypes: LeaveType[];
  periodFrom: string;
  periodTo: string;
};

export const EMPTY_LEAVE_RECORD_FILTERS: LeaveRecordFilterValues = {
  name: "",
  leaveTypes: [],
  periodFrom: "",
  periodTo: "",
};

function isFullIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function includesNormalized(haystack: string, needle: string) {
  const h = haystack.trim().toLowerCase();
  const n = needle.trim().toLowerCase();
  return n ? h.includes(n) : true;
}

function dateRangesOverlap(
  recordStart: string,
  recordEnd: string,
  filterFrom: string,
  filterTo: string,
): boolean {
  const from = isFullIsoDate(filterFrom) ? filterFrom : "";
  const to = isFullIsoDate(filterTo) ? filterTo : "";

  if (from && recordEnd < from) {
    return false;
  }

  if (to && recordStart > to) {
    return false;
  }

  return true;
}

export function filterLeaveRecords<
  T extends {
    name: string;
    leaveType: LeaveType;
    periodStart: string;
    periodEnd: string;
  },
>(items: T[], filters: LeaveRecordFilterValues): T[] {
  const selectedTypes = new Set(filters.leaveTypes);

  return items.filter((row) => {
    if (!includesNormalized(row.name, filters.name)) {
      return false;
    }

    if (selectedTypes.size > 0 && !selectedTypes.has(row.leaveType)) {
      return false;
    }

    if (
      !dateRangesOverlap(
        row.periodStart,
        row.periodEnd,
        filters.periodFrom,
        filters.periodTo,
      )
    ) {
      return false;
    }

    return true;
  });
}
