"use client";

import { useEffect, useMemo, useState } from "react";
import { Archive } from "lucide-react";

import { CompletedOfficeTasksFilters } from "@/components/firm/office-tasks/completed-office-tasks-filters";
import { OfficeTaskDetailsDialog } from "@/components/firm/office-tasks/office-task-details-dialog";
import { OfficeTaskFormDialog } from "@/components/firm/office-tasks/office-task-form-dialog";
import { OfficeTaskItem } from "@/components/firm/office-tasks/office-task-item";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { CRUD_PAGE_SIZE } from "@/lib/constants/pagination";
import {
  EMPTY_OFFICE_TASK_FILTERS,
  filterCompletedOfficeTasks,
  type OfficeTaskFilterValues,
} from "@/lib/filters/office-tasks";
import type {
  OfficeTaskCompanyOption,
  OfficeTaskStaffOption,
  OfficeTaskTableRow,
} from "@/lib/office-tasks/types";
import { paginate } from "@/lib/pagination";

type CompletedOfficeTasksListProps = {
  tasks: OfficeTaskTableRow[];
  currentUserId: string;
  isAdmin: boolean;
  staffUsers: OfficeTaskStaffOption[];
  companies: OfficeTaskCompanyOption[];
};

export function CompletedOfficeTasksList({
  tasks,
  currentUserId,
  isAdmin,
  staffUsers,
  companies,
}: CompletedOfficeTasksListProps) {
  const [draftFilters, setDraftFilters] = useState(EMPTY_OFFICE_TASK_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(
    EMPTY_OFFICE_TASK_FILTERS,
  );
  const [page, setPage] = useState(1);
  const [detailsTask, setDetailsTask] = useState<OfficeTaskTableRow | null>(null);
  const [editingTask, setEditingTask] = useState<OfficeTaskTableRow | null>(null);

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

  function handleDraftChange(next: OfficeTaskFilterValues) {
    setDraftFilters(next);
    setAppliedFilters(next);
    setPage(1);
  }

  function handleSearch() {
    setAppliedFilters(draftFilters);
    setPage(1);
  }

  function handleClear() {
    setDraftFilters(EMPTY_OFFICE_TASK_FILTERS);
    setAppliedFilters(EMPTY_OFFICE_TASK_FILTERS);
    setPage(1);
  }

  function handleOpenDetails(task: OfficeTaskTableRow) {
    setDetailsTask(task);
  }

  function handleEdit(task: OfficeTaskTableRow) {
    setDetailsTask(null);
    setEditingTask(task);
  }

  return (
    <>
      <Card className="border border-border shadow-sm ring-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Archive className="size-4 text-primary" />
            완료된 업무
          </CardTitle>
          <CardDescription>
            완료 시각이 최신인 순으로 정렬됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CompletedOfficeTasksFilters
            draft={draftFilters}
            onDraftChange={handleDraftChange}
            onSearch={handleSearch}
            onClear={handleClear}
            companies={companies}
          />

          {filteredTasks.length === 0 ? (
            <EmptyState
              message={
                tasks.length === 0
                  ? "완료된 업무가 없습니다."
                  : "검색 조건에 맞는 업무가 없습니다."
              }
            />
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <div className="space-y-2 bg-muted/20 p-3">
                {pagination.items.map((task) => (
                  <OfficeTaskItem
                    key={task.id}
                    task={task}
                    variant="completed"
                    onOpenDetails={handleOpenDetails}
                  />
                ))}
              </div>
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

      <OfficeTaskDetailsDialog
        task={detailsTask}
        open={detailsTask !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDetailsTask(null);
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
              setEditingTask(null);
            }
          }}
        />
      ) : null}
    </>
  );
}
