import type { OfficeTaskTableRow } from "@/lib/office-tasks/types";

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

export type OfficeTaskDueUrgencyBadge = {
  kind: "overdue" | "days" | "hours" | "minutes";
  label: string;
  className: string;
};

const URGENCY_BADGE_CLASS = {
  days: "bg-emerald-600/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  hours: "bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  minutes: "bg-destructive/10 text-destructive dark:bg-destructive/20",
  overdue: "bg-destructive text-white dark:bg-destructive dark:text-white",
} as const;

export function getOfficeTaskDueUrgencyBadge(
  task: Pick<OfficeTaskTableRow, "dueAtIso" | "isOverdue">,
  now = new Date(),
): OfficeTaskDueUrgencyBadge {
  const diffMs = new Date(task.dueAtIso).getTime() - now.getTime();

  if (task.isOverdue || diffMs <= 0) {
    return {
      kind: "overdue",
      label: "마감 지남",
      className: URGENCY_BADGE_CLASS.overdue,
    };
  }

  if (diffMs >= MS_PER_DAY) {
    const days = Math.floor(diffMs / MS_PER_DAY);
    return {
      kind: "days",
      label: `${days}일 남음`,
      className: URGENCY_BADGE_CLASS.days,
    };
  }

  if (diffMs >= MS_PER_HOUR) {
    const hours = Math.floor(diffMs / MS_PER_HOUR);
    return {
      kind: "hours",
      label: `${hours}시간 남음`,
      className: URGENCY_BADGE_CLASS.hours,
    };
  }

  const minutes = Math.max(1, Math.floor(diffMs / MS_PER_MINUTE));
  return {
    kind: "minutes",
    label: `${minutes}분 남음`,
    className: URGENCY_BADGE_CLASS.minutes,
  };
}
