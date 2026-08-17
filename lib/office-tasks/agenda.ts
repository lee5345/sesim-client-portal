import { formatKstDateKey } from "@/lib/datetime/kst";
import type { OfficeTaskTableRow } from "@/lib/office-tasks/types";

const RECENTLY_ADDED_MS = 24 * 60 * 60 * 1000;

export type OfficeTaskAgenda = {
  today: OfficeTaskTableRow[];
  tomorrow: OfficeTaskTableRow[];
  recentlyAdded: OfficeTaskTableRow[];
};

export function shiftKstDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  const nextYear = utc.getUTCFullYear();
  const nextMonth = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const nextDay = String(utc.getUTCDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

export function groupActiveOfficeTasksForAgenda(
  tasks: OfficeTaskTableRow[],
  now = new Date(),
): OfficeTaskAgenda {
  const todayKey = formatKstDateKey(now);
  const tomorrowKey = shiftKstDateKey(todayKey, 1);
  const recentCutoff = now.getTime() - RECENTLY_ADDED_MS;

  const today: OfficeTaskTableRow[] = [];
  const tomorrow: OfficeTaskTableRow[] = [];
  const recentlyAdded: OfficeTaskTableRow[] = [];

  for (const task of tasks) {
    const dueKey = formatKstDateKey(new Date(task.dueAtIso));
    if (dueKey === todayKey) {
      today.push(task);
    } else if (dueKey === tomorrowKey) {
      tomorrow.push(task);
    } else if (new Date(task.createdAt).getTime() >= recentCutoff) {
      recentlyAdded.push(task);
    }
  }

  recentlyAdded.sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );

  return { today, tomorrow, recentlyAdded };
}
