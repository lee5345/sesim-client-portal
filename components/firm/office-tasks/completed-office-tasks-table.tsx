"use client";

import { useEffect, useMemo, useState } from "react";
import { Archive } from "lucide-react";

import { CompletedOfficeTasksFilters } from "@/components/firm/office-tasks/completed-office-tasks-filters";
import { OfficeTaskFormDialog } from "@/components/firm/office-tasks/office-task-form-dialog";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { CompactDateTime } from "@/components/ui/compact-datetime";
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
import {
  EMPTY_OFFICE_TASK_FILTERS,
  filterCompletedOfficeTasks,
} from "@/lib/filters/office-tasks";
import { formatDate, formatKoreanTime } from "@/lib/format/date";
import type {
  OfficeTaskCompanyOption,
  OfficeTaskStaffOption,
  OfficeTaskTableRow,
} from "@/lib/office-tasks/types";
import { paginate } from "@/lib/pagination";
import { cn } from "@/lib/utils";
import {
  deleteOfficeTask,
  reopenOfficeTask,
} from "@/modules/office-tasks/actions";

type CompletedOfficeTasksTableProps = {
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

export function CompletedOfficeTasksTable({
  tasks,
  currentUserId,
  isAdmin,
  staffUsers,
  companies,
}: CompletedOfficeTasksTableProps) {
  const [draftFilters, setDraftFilters] = useState(EMPTY_OFFICE_TASK_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(
    EMPTY_OFFICE_TASK_FILTERS,
  );
  const [page, setPage] = useState(1);

  const filteredTasks = useMemo(
    () => filterCompletedOfficeTasks(tasks, appliedFilters),
    [tasks, appliedFilters],
  );

  const pagination = useMemo(
    () => paginate(filteredTasks, page, CRUD_PAGE_SIZE),
    [filteredTasks, page],
  );

  useEffect(() => {
    if (page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [page, pagination.totalPages]);

  return (
    <div className="space-y-4">
      <CompletedOfficeTasksFilters
        draft={draftFilters}
        onDraftChange={setDraftFilters}
        onSearch={() => {
          setAppliedFilters(draftFilters);
          setPage(1);
        }}
        onClear={() => {
          setDraftFilters(EMPTY_OFFICE_TASK_FILTERS);
          setAppliedFilters(EMPTY_OFFICE_TASK_FILTERS);
          setPage(1);
        }}
        companies={companies}
      />

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="size-5" />
            완료된 업무
          </CardTitle>
          <CardDescription>
            완료 시각이 최신인 순으로 정렬됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent
          className={cn("min-w-0", filteredTasks.length > 0 && "p-0")}
        >
          {filteredTasks.length === 0 ? (
            <EmptyState
              message={
                tasks.length === 0
                  ? "완료된 업무가 없습니다."
                  : "검색 조건에 맞는 업무가 없습니다."
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">제목</th>
                    <th className="px-4 py-3 text-left font-medium">완료</th>
                    <th className="px-4 py-3 text-left font-medium">
                      완료 처리자
                    </th>
                    <th className="px-4 py-3 text-left font-medium">마감</th>
                    <th className="px-4 py-3 text-left font-medium">담당자</th>
                    <th className="px-4 py-3 text-left font-medium">고객사</th>
                    <th className="px-4 py-3 text-center font-medium">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.items.map((task) => (
                    <tr
                      key={task.id}
                      className="group border-b last:border-b-0 hover:bg-muted/30"
                    >
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
                      <td className="px-4 py-3 align-middle whitespace-nowrap">
                        {task.completedAtIso ? (
                          <CompactDateTime date={new Date(task.completedAtIso)} />
                        ) : (
                          EMPTY_CELL
                        )}
                      </td>
                      <td className="px-4 py-3 align-middle whitespace-nowrap">
                        {task.completedBy?.name ?? EMPTY_CELL}
                      </td>
                      <td className="px-4 py-3 align-middle whitespace-nowrap">
                        {formatDeadline(task)}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        {formatAssigneeNames(task.assignees)}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        {task.company?.name ?? EMPTY_CELL}
                      </td>
                      <td className="px-4 py-3 text-center align-middle">
                        <div className="flex items-center justify-center gap-1">
                          <ConfirmDeleteDialog
                            title="업무 다시 열기"
                            description="이 업무를 다시 진행 중 목록으로 되돌리시겠습니까?"
                            action={reopenOfficeTask}
                            hiddenFields={{ id: task.id }}
                            triggerLabel="다시 열기"
                            confirmLabel="다시 열기"
                            triggerVariant="outline"
                            triggerSize="sm"
                          />
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
    </div>
  );
}
