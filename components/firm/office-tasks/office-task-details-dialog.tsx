"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { MultilineText } from "@/components/ui/multiline-text";
import { OfficeTaskDueLabel } from "@/components/firm/office-tasks/office-task-due-label";
import { formatDateTime } from "@/lib/format/date";
import {
  EMPTY_TASK_CELL,
  formatAssigneeNames,
  formatTaskCompanyName,
  isCompletedOfficeTask,
} from "@/lib/office-tasks/display";
import type { OfficeTaskTableRow } from "@/lib/office-tasks/types";
import { cn } from "@/lib/utils";

type OfficeTaskDetailsDialogProps = {
  task: OfficeTaskTableRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (task: OfficeTaskTableRow) => void;
};

function DetailField({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div
        className={cn(
          "rounded-lg border bg-muted/30 px-3 py-2 text-sm",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

function MetadataLine({ label, children }: { label: string; children: ReactNode }) {
  return (
    <p className="text-xs text-muted-foreground">
      <span>{label}</span>
      <span className="mx-1.5 text-border">·</span>
      <span>{children}</span>
    </p>
  );
}

export function OfficeTaskDetailsDialog({
  task,
  open,
  onOpenChange,
  onEdit,
}: OfficeTaskDetailsDialogProps) {
  const completed = task ? isCompletedOfficeTask(task) : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <div className="shrink-0 border-b bg-muted/50 px-4 py-4">
          <DialogTitle className="text-lg leading-snug font-semibold">
            {task?.title ?? "업무 상세"}
          </DialogTitle>
        </div>

        {task ? (
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            <DetailField label="고객사">
              {formatTaskCompanyName(task.company)}
            </DetailField>
            <DetailField label="설명" className="min-h-10">
              <MultilineText value={task.description} />
            </DetailField>
            <DetailField label="마감">
              <OfficeTaskDueLabel
                task={task}
                overdue={task.isOverdue && !completed}
              />
            </DetailField>
            <DetailField label="담당자">
              {formatAssigneeNames(task.assignees)}
            </DetailField>
          </div>
        ) : null}

        {task ? (
          <div
            className={cn(
              "grid shrink-0 gap-4 border-t px-4 py-3",
              completed && "sm:grid-cols-2",
            )}
          >
            <div className="space-y-1">
              <MetadataLine label="등록자">{task.createdBy.name}</MetadataLine>
              <MetadataLine label="등록 시각">
                {formatDateTime(new Date(task.createdAt))}
              </MetadataLine>
            </div>
            {completed ? (
              <div className="space-y-1">
                <MetadataLine label="완료 처리자">
                  {task.completedBy?.name ?? EMPTY_TASK_CELL}
                </MetadataLine>
                <MetadataLine label="완료 시각">
                  {task.completedAtIso
                    ? formatDateTime(new Date(task.completedAtIso))
                    : EMPTY_TASK_CELL}
                </MetadataLine>
              </div>
            ) : null}
          </div>
        ) : null}

        {task ? (
          <DialogFooter className="mx-0 mb-0 shrink-0 rounded-none border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              닫기
            </Button>
            <Button type="button" onClick={() => onEdit(task)}>
              수정
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
