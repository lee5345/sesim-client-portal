import { formatKstDateKey } from "@/lib/datetime/kst";
import type { OfficeTaskTableRow } from "@/lib/office-tasks/types";

const RECENTLY_ADDED_MS = 24 * 60 * 60 * 1000;

export type OfficeTaskAgendaItem = Pick<
  OfficeTaskTableRow,
  "dueAtIso" | "createdAt" | "isOverdue"
>;

export type OfficeTaskAgenda<T extends OfficeTaskAgendaItem = OfficeTaskTableRow> =
  {
    today: T[];
    tomorrow: T[];
    recentlyAdded: T[];
  };

export function shiftKstDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  const nextYear = utc.getUTCFullYear();
  const nextMonth = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const nextDay = String(utc.getUTCDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

export function groupActiveOfficeTasksForAgenda<T extends OfficeTaskAgendaItem>(
  tasks: T[],
  now = new Date(),
): OfficeTaskAgenda<T> {
  const todayKey = formatKstDateKey(now);
  const tomorrowKey = shiftKstDateKey(todayKey, 1);
  const recentCutoff = now.getTime() - RECENTLY_ADDED_MS;

  const today: T[] = [];
  const tomorrow: T[] = [];
  const recentlyAdded: T[] = [];

  for (const task of tasks) {
    const dueKey = formatKstDateKey(new Date(task.dueAtIso));
    if (dueKey === todayKey) {
      today.push(task);
    } else if (dueKey === tomorrowKey) {
      tomorrow.push(task);
    } else if (
      !task.isOverdue &&
      new Date(task.createdAt).getTime() >= recentCutoff
    ) {
      recentlyAdded.push(task);
    }
  }

  recentlyAdded.sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );

  return { today, tomorrow, recentlyAdded };
}

export function countOfficeTaskAgendaHighlights(
  agenda: OfficeTaskAgenda<OfficeTaskAgendaItem>,
) {
  return agenda.today.length + agenda.tomorrow.length;
}

export function summarizeOfficeTaskNavBadges(
  tasks: Array<OfficeTaskAgendaItem & { isOverdue: boolean }>,
  now = new Date(),
) {
  return {
    agendaCount: countOfficeTaskAgendaHighlights(
      groupActiveOfficeTasksForAgenda(tasks, now),
    ),
    overdueCount: tasks.filter((task) => task.isOverdue).length,
  };
}
