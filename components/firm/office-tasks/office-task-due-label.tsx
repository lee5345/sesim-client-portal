import { formatDate, formatKoreanTime } from "@/lib/format/date";
import type { OfficeTaskTableRow } from "@/lib/office-tasks/types";
import { cn } from "@/lib/utils";

type OfficeTaskDueLabelProps = {
  task: OfficeTaskTableRow;
  className?: string;
  compact?: boolean;
  overdue?: boolean;
};

export function OfficeTaskDueLabel({
  task,
  className,
  compact = false,
  overdue = false,
}: OfficeTaskDueLabelProps) {
  const due = new Date(task.dueAtIso);
  const dateLabel = formatDate(due);
  const timeLabel = task.hasDueTime ? formatKoreanTime(due) : null;
  const overdueClassName = overdue ? "font-medium text-destructive" : undefined;

  if (compact) {
    return (
      <span className={cn(overdueClassName, className)}>
        {dateLabel}
        {timeLabel ? ` ${timeLabel}` : ""}
      </span>
    );
  }

  if (timeLabel) {
    return (
      <div className={cn("space-y-0.5", overdueClassName, className)}>
        <div>{dateLabel}</div>
        <div className={overdue ? "text-destructive" : "text-muted-foreground"}>
          {timeLabel}
        </div>
      </div>
    );
  }

  return (
    <span className={cn(overdueClassName, className)}>{dateLabel}</span>
  );
}
