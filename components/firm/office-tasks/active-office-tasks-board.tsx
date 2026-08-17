"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ClipboardList } from "lucide-react";

import { OfficeTaskAgendaSidebar } from "@/components/firm/office-tasks/office-task-agenda-sidebar";
import { OfficeTaskDetailsDialog } from "@/components/firm/office-tasks/office-task-details-dialog";
import { OfficeTaskFormDialog } from "@/components/firm/office-tasks/office-task-form-dialog";
import { OfficeTaskItem } from "@/components/firm/office-tasks/office-task-item";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { groupActiveOfficeTasksForAgenda } from "@/lib/office-tasks/agenda";
import {
  getOfficeTaskManagerHref,
  parseOfficeTaskDialogFromSearchParams,
  TASK_MANAGER_PATH,
} from "@/lib/office-tasks/paths";
import type {
  OfficeTaskCompanyOption,
  OfficeTaskStaffOption,
  OfficeTaskTableRow,
} from "@/lib/office-tasks/types";

type ActiveOfficeTasksBoardProps = {
  tasks: OfficeTaskTableRow[];
  currentUserId: string;
  isAdmin: boolean;
  staffUsers: OfficeTaskStaffOption[];
  companies: OfficeTaskCompanyOption[];
};

export function ActiveOfficeTasksBoard({
  tasks,
  currentUserId,
  isAdmin,
  staffUsers,
  companies,
}: ActiveOfficeTasksBoardProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [detailsTask, setDetailsTask] = useState<OfficeTaskTableRow | null>(null);
  const [editingTask, setEditingTask] = useState<OfficeTaskTableRow | null>(null);

  const agenda = useMemo(() => groupActiveOfficeTasksForAgenda(tasks), [tasks]);

  useEffect(() => {
    const { taskId, mode } = parseOfficeTaskDialogFromSearchParams(searchParams);

    if (!taskId) {
      setDetailsTask(null);
      setEditingTask(null);
      return;
    }

    const matchedTask = tasks.find((task) => task.id === taskId);
    if (!matchedTask) {
      router.replace(TASK_MANAGER_PATH);
      return;
    }

    if (mode === "edit") {
      setEditingTask(matchedTask);
      setDetailsTask(null);
      return;
    }

    setDetailsTask(matchedTask);
    setEditingTask(null);
  }, [router, searchParams, tasks]);

  function replaceDialogUrl(taskId: string | null, mode: "view" | "edit" | null) {
    if (!taskId || !mode) {
      router.replace(TASK_MANAGER_PATH);
      return;
    }

    router.replace(getOfficeTaskManagerHref(taskId, mode));
  }

  function handleOpenDetails(task: OfficeTaskTableRow) {
    replaceDialogUrl(task.id, "view");
  }

  function handleCloseDetails() {
    replaceDialogUrl(null, null);
  }

  function handleEdit(task: OfficeTaskTableRow) {
    replaceDialogUrl(task.id, "edit");
  }

  function handleCloseEdit() {
    const taskId = editingTask?.id ?? searchParams.get("task");
    if (taskId) {
      replaceDialogUrl(taskId, "view");
      return;
    }

    replaceDialogUrl(null, null);
  }

  return (
    <div className="h-full min-h-0">
      <Card className="flex h-full min-h-0 flex-col overflow-hidden border border-border py-0 shadow-sm ring-0 lg:flex-row lg:items-stretch lg:gap-0">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-(--card-spacing) py-(--card-spacing)">
          <CardHeader className="shrink-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="size-4 text-primary" />
              진행 중인 업무
            </CardTitle>
            <CardDescription>
              마감일이 가까운 순으로 정렬됩니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-muted/20">
              {tasks.length === 0 ? (
                <div className="flex flex-1 items-center justify-center p-6">
                  <p className="text-sm text-muted-foreground">
                    진행 중인 업무가 없습니다.
                  </p>
                </div>
              ) : (
                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
                  {tasks.map((task) => (
                    <OfficeTaskItem
                      key={task.id}
                      task={task}
                      variant="active"
                      onOpenDetails={handleOpenDetails}
                    />
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </div>

        <aside className="flex h-72 min-h-0 w-full shrink-0 flex-col overflow-hidden border-t bg-muted/20 lg:h-auto lg:w-64 lg:border-t-0 lg:border-l">
          <OfficeTaskAgendaSidebar
            agenda={agenda}
            onOpenDetails={handleOpenDetails}
          />
        </aside>
      </Card>

      <OfficeTaskDetailsDialog
        task={detailsTask}
        open={detailsTask !== null}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseDetails();
          }
        }}
        onEdit={handleEdit}
      />

      {editingTask ? (
        <OfficeTaskFormDialog
          mode="edit"
          task={editingTask}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          staffUsers={staffUsers}
          companies={companies}
          open
          showTrigger={false}
          onOpenChange={(open) => {
            if (!open) {
              handleCloseEdit();
            }
          }}
        />
      ) : null}
    </div>
  );
}
