"use client";

import type { SyntheticEvent } from "react";

import { OfficeTaskDueLabel } from "@/components/firm/office-tasks/office-task-due-label";
import { Badge } from "@/components/ui/badge";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { getOfficeTaskDueUrgencyBadge } from "@/lib/office-tasks/due-urgency";
import {
  formatAssigneeNames,
  formatTaskCompanyBadgeLabel,
  formatTaskCompanyName,
} from "@/lib/office-tasks/display";
import type { OfficeTaskTableRow } from "@/lib/office-tasks/types";
import { cn } from "@/lib/utils";
import { completeOfficeTask, reopenOfficeTask } from "@/modules/office-tasks/actions";

type OfficeTaskItemProps = {
  task: OfficeTaskTableRow;
  variant: "active" | "completed";
  onOpenDetails: (task: OfficeTaskTableRow) => void;
};

function stopRowActivation(event: SyntheticEvent) {
  event.stopPropagation();
}

export function OfficeTaskItem({
  task,
  variant,
  onOpenDetails,
}: OfficeTaskItemProps) {
  const isActive = variant === "active";
  const showOverdue = isActive && task.isOverdue;
  const urgencyBadge = isActive ? getOfficeTaskDueUrgencyBadge(task) : null;
  const companyLabel = formatTaskCompanyName(task.company);
  const companyBadgeLabel = formatTaskCompanyBadgeLabel(task.company);

  return (
    <div
      role="button"
      tabIndex={0}
      className="flex w-full flex-col gap-3 rounded-lg border bg-card px-3 py-3 text-left text-sm shadow-sm transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:flex-row sm:items-center"
      onClick={() => onOpenDetails(task)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpenDetails(task);
        }
      }}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-lg leading-snug font-semibold">{task.title}</p>
        <p className="text-muted-foreground">
          {formatAssigneeNames(task.assignees)}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-16 self-center sm:gap-20">
        <div className="flex flex-col items-end gap-1.5">
          <Badge
            variant="secondary"
            className="font-normal"
            title={companyBadgeLabel !== companyLabel ? companyLabel : undefined}
          >
            {companyBadgeLabel}
          </Badge>
          {urgencyBadge ? (
            <Badge
              variant="outline"
              className={cn(
                "border-transparent font-normal",
                urgencyBadge.className,
              )}
            >
              {urgencyBadge.label}
            </Badge>
          ) : null}
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="shrink-0 text-right whitespace-nowrap">
            <OfficeTaskDueLabel task={task} overdue={showOverdue} />
          </div>

          <div
            onClick={stopRowActivation}
            onPointerDown={stopRowActivation}
            onKeyDown={stopRowActivation}
          >
            {isActive ? (
              <ConfirmDeleteDialog
                title="업무 완료"
                description="이 업무를 완료 처리하시겠습니까? 완료된 업무는 완료 목록으로 이동합니다."
                action={completeOfficeTask}
                hiddenFields={{ id: task.id }}
                triggerLabel="업무 완료"
                confirmLabel="업무 완료"
                confirmVariant="success"
                triggerVariant="outline"
                triggerSize="sm"
                iconTrigger={false}
              />
            ) : (
              <ConfirmDeleteDialog
                title="업무 다시 열기"
                description="이 업무를 다시 진행 중 목록으로 되돌리시겠습니까?"
                action={reopenOfficeTask}
                hiddenFields={{ id: task.id }}
                triggerLabel="다시 열기"
                confirmLabel="다시 열기"
                triggerVariant="outline"
                triggerSize="sm"
                iconTrigger={false}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
