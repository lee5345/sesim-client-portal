"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList } from "lucide-react";

import { OfficeTaskFormDialog } from "@/components/firm/office-tasks/office-task-form-dialog";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { MultilineText } from "@/components/ui/multiline-text";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CRUD_PAGE_SIZE } from "@/lib/constants/pagination";
import { formatDate, formatKoreanTime } from "@/lib/format/date";
import type {
  OfficeTaskCompanyOption,
  OfficeTaskStaffOption,
  OfficeTaskTableRow,
} from "@/lib/office-tasks/types";
import { paginate } from "@/lib/pagination";
import { cn } from "@/lib/utils";
import {
  completeOfficeTask,
  deleteOfficeTask,
} from "@/modules/office-tasks/actions";

type ActiveOfficeTasksTableProps = {
  tasks: OfficeTaskTableRow[];
  currentUserId: string;
  isAdmin: boolean;
  staffUsers: OfficeTaskStaffOption[];
  companies: OfficeTaskCompanyOption[];
};

const EMPTY_CELL = "—";

function formatAssigneeNames(assignees: { name: string }[]) {
  if (assignees.length === 0) {
    return EMPTY_CELL;
  }
  return assignees.map((assignee) => assignee.name).join(", ");
}

function formatDeadline(task: OfficeTaskTableRow) {
  if (task.hasDueTime) {
    return (
      <div className="space-y-0.5">
        <div>{formatDate(new Date(task.dueAtIso))}</div>
        <div className="text-muted-foreground">
          {formatKoreanTime(new Date(task.dueAtIso))}
        </div>
      </div>
    );
  }

  return formatDate(new Date(task.dueAtIso));
}

export function ActiveOfficeTasksTable({
  tasks,
  currentUserId,
  isAdmin,
  staffUsers,
  companies,
}: ActiveOfficeTasksTableProps) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const pagination = useMemo(() => paginate(tasks, page, CRUD_PAGE_SIZE), [
    tasks,
    page,
  ]);

  useEffect(() => {
    if (page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [page, pagination.totalPages]);

  function handleComplete(taskId: string) {
    setCompletingId(taskId);
    const formData = new FormData();
    formData.set("id", taskId);

    startTransition(async () => {
      await completeOfficeTask(formData);
      setCompletingId(null);
      router.refresh();
    });
  }

  return (
    <Card className="min-w-0">
        <CardHeader className="flex shrink-0 flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="size-4 text-primary" />
              진행 중인 업무
            </CardTitle>
            <CardDescription>
              마감일이 가까운 순으로 정렬됩니다. 완료하려면 체크박스를 선택하세요.
            </CardDescription>
          </div>
          <OfficeTaskFormDialog
            mode="create"
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            staffUsers={staffUsers}
            companies={companies}
          />
        </CardHeader>
        <CardContent className={cn("min-w-0", tasks.length > 0 && "p-0")}>
          {tasks.length === 0 ? (
            <EmptyState message="등록된 업무가 없습니다. 업무 등록 버튼으로 첫 항목을 추가해 주세요." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="w-12 px-4 py-3 text-center font-medium">
                      완료
                    </th>
                    <th className="px-4 py-3 text-left font-medium">제목</th>
                    <th className="px-4 py-3 text-left font-medium">마감</th>
                    <th className="px-4 py-3 text-left font-medium">담당자</th>
                    <th className="px-4 py-3 text-left font-medium">고객사</th>
                    <th className="px-4 py-3 text-left font-medium">등록자</th>
                    <th className="px-4 py-3 text-center font-medium">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.items.map((task) => (
                    <tr
                      key={task.id}
                      className="group border-b last:border-b-0 hover:bg-muted/30"
                    >
                      <td className="px-4 py-3 text-center align-middle">
                        <input
                          type="checkbox"
                          className="size-4 rounded border-input accent-primary"
                          aria-label={`${task.title} 완료`}
                          disabled={completingId === task.id}
                          onChange={() => handleComplete(task.id)}
                        />
                      </td>
                      <td className="max-w-xs px-4 py-3 align-top">
                        <div className="space-y-1">
                          <p className="font-medium">{task.title}</p>
                          {task.description ? (
                            <MultilineText
                              value={task.description}
                              className="text-muted-foreground"
                            />
                          ) : null}
                        </div>
                      </td>
                      <td
                        className={cn(
                          "px-4 py-3 align-middle whitespace-nowrap",
                          task.isOverdue && "font-medium text-destructive",
                        )}
                      >
                        {formatDeadline(task)}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        {formatAssigneeNames(task.assignees)}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        {task.company?.name ?? EMPTY_CELL}
                      </td>
                      <td className="px-4 py-3 align-middle whitespace-nowrap">
                        {task.createdBy.name}
                      </td>
                      <td className="px-4 py-3 text-center align-middle">
                        <div className="flex items-center justify-center gap-1">
                          <OfficeTaskFormDialog
                            mode="edit"
                            task={task}
                            currentUserId={currentUserId}
                            isAdmin={isAdmin}
                            staffUsers={staffUsers}
                            companies={companies}
                          />
                          <ConfirmDeleteDialog
                            title="업무 삭제"
                            description="이 업무를 삭제하면 복구할 수 없습니다. 계속하시겠습니까?"
                            action={deleteOfficeTask}
                            hiddenFields={{ id: task.id }}
                            triggerLabel="삭제"
                            requireTypedConfirmation
                            triggerVariant="destructive"
                            triggerSize="sm"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <DataTablePagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                rangeStart={pagination.rangeStart}
                rangeEnd={pagination.rangeEnd}
                total={pagination.total}
                onPageChange={setPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
  );
}
