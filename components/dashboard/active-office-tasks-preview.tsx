import Link from "next/link";
import { ArrowRight, ClipboardList } from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { OfficeTaskDueLabel } from "@/components/firm/office-tasks/office-task-due-label";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getOfficeTaskDueUrgencyBadge } from "@/lib/office-tasks/due-urgency";
import {
  formatAssigneeNames,
  formatTaskCompanyBadgeLabel,
} from "@/lib/office-tasks/display";
import { getOfficeTaskManagerHref } from "@/lib/office-tasks/paths";
import type { OfficeTaskTableRow } from "@/lib/office-tasks/types";
import { cn } from "@/lib/utils";

type ActiveOfficeTasksPreviewProps = {
  tasks: OfficeTaskTableRow[];
};

export function ActiveOfficeTasksPreview({ tasks }: ActiveOfficeTasksPreviewProps) {
  return (
    <Card className="flex min-h-0 flex-col overflow-hidden lg:h-0 lg:min-h-full">
      <CardHeader className="shrink-0">
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="size-5" />
          진행 중인 업무
        </CardTitle>
        <CardDescription>
          {tasks.length > 0
            ? `마감일이 가까운 순 · ${tasks.length}건`
            : "사무소 직원용 할 일 관리"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
        {tasks.length === 0 ? (
          <EmptyState
            className="min-h-0 flex-1"
            message="진행 중인 업무가 없습니다."
          />
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ul className="space-y-2 pr-1">
              {tasks.map((task) => {
                const urgencyBadge = getOfficeTaskDueUrgencyBadge(task);

                return (
                  <li key={task.id}>
                    <Link
                      href={getOfficeTaskManagerHref(task.id)}
                      className="group flex flex-col gap-2 rounded-lg border bg-card px-3 py-3 text-sm shadow-sm transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="line-clamp-2 font-semibold leading-snug group-hover:text-primary">
                          {task.title}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn(
                            "shrink-0 border-transparent font-normal",
                            urgencyBadge.className,
                          )}
                        >
                          {urgencyBadge.label}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="font-normal">
                          {formatTaskCompanyBadgeLabel(task.company)}
                        </Badge>
                        <span aria-hidden="true">·</span>
                        <span>{formatAssigneeNames(task.assignees)}</span>
                        <span aria-hidden="true">·</span>
                        <OfficeTaskDueLabel
                          task={task}
                          compact
                          overdue={task.isOverdue}
                        />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <Link
          href={getOfficeTaskManagerHref()}
          className={cn(
            buttonVariants({ variant: "secondary" }),
            "mt-auto w-full shrink-0 sm:w-auto",
          )}
        >
          업무 관리 열기
          <ArrowRight />
        </Link>
      </CardContent>
    </Card>
  );
}
