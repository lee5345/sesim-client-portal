"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { SearchableCompanySelect } from "@/components/firm/office-tasks/searchable-company-select";
import { MultiSelectFilter } from "@/components/filters/multi-select-filter";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FieldLabel } from "@/components/ui/field-label";
import { Input } from "@/components/ui/input";
import { NotesTextarea } from "@/components/ui/notes-textarea";
import { getRoleLabel } from "@/lib/auth/roles";
import {
  DEFAULT_DUE_TIME_PICKER,
  DUE_TIME_HOURS,
  DUE_TIME_MINUTES,
  dueTime24ToPicker,
  dueTimePickerTo24,
  type DueTimePeriod,
} from "@/lib/datetime/kst";
import type {
  OfficeTaskCompanyOption,
  OfficeTaskStaffOption,
  OfficeTaskTableRow,
} from "@/lib/office-tasks/types";
import {
  createOfficeTask,
  deleteOfficeTask,
  updateOfficeTask,
} from "@/modules/office-tasks/actions";

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30 dark:disabled:bg-input/80";

const textareaClassName =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30";

type OfficeTaskFormValues = {
  title: string;
  description: string;
  dueDate: string;
  hasDueTime: boolean;
  dueTimeHour: string;
  dueTimeMinute: string;
  dueTimePeriod: DueTimePeriod;
  companyId: string | null;
  assigneeIds: string[];
};

type OfficeTaskFormDialogProps = {
  mode: "create" | "edit";
  currentUserId: string;
  isAdmin: boolean;
  staffUsers: OfficeTaskStaffOption[];
  companies: OfficeTaskCompanyOption[];
  task?: OfficeTaskTableRow;
  triggerVariant?: "default" | "outline" | "ghost";
  triggerSize?: "default" | "xs" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
};

function getInitialValues(
  task: OfficeTaskTableRow | undefined,
  currentUserId: string,
): OfficeTaskFormValues {
  const hasDueTime = task?.hasDueTime ?? false;
  const dueTimePicker = task?.dueTime
    ? dueTime24ToPicker(task.dueTime)
    : DEFAULT_DUE_TIME_PICKER;

  return {
    title: task?.title ?? "",
    description: task?.description ?? "",
    dueDate: task?.dueDate ?? "",
    hasDueTime,
    dueTimeHour: dueTimePicker.hour,
    dueTimeMinute: dueTimePicker.minute,
    dueTimePeriod: dueTimePicker.period,
    companyId: task?.company?.id ?? null,
    assigneeIds:
      task && task.assignees.length > 0
        ? task.assignees.map((assignee) => assignee.id)
        : [currentUserId],
  };
}

export function OfficeTaskFormDialog({
  mode,
  currentUserId,
  isAdmin,
  staffUsers,
  companies,
  task,
  triggerVariant = mode === "create" ? "default" : "ghost",
  triggerSize = mode === "create" ? "default" : "icon-sm",
  open: openProp,
  onOpenChange,
  showTrigger = true,
}: OfficeTaskFormDialogProps) {
  const router = useRouter();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assigneeMenuOpen, setAssigneeMenuOpen] = useState(false);
  const [values, setValues] = useState<OfficeTaskFormValues>(() =>
    getInitialValues(task, currentUserId),
  );
  const [isPending, startTransition] = useTransition();
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolledOpen;

  function setOpen(nextOpen: boolean) {
    if (!isControlled) {
      setUncontrolledOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  }

  useEffect(() => {
    if (open) {
      setValues(getInitialValues(task, currentUserId));
      setError(null);
    }
  }, [open, task, currentUserId]);

  const selectableStaff = useMemo(() => {
    const selectedSet = new Set(values.assigneeIds);
    return staffUsers.filter(
      (user) => user.isActive || selectedSet.has(user.id),
    );
  }, [staffUsers, values.assigneeIds]);

  function toggleAssignee(userId: string) {
    if (!isAdmin) {
      return;
    }

    setValues((current) => {
      const exists = current.assigneeIds.includes(userId);
      const next = exists
        ? current.assigneeIds.filter((id) => id !== userId)
        : [...current.assigneeIds, userId];
      return { ...current, assigneeIds: next };
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData();
    if (mode === "edit" && task) {
      formData.set("id", task.id);
    }
    formData.set("title", values.title);
    formData.set("description", values.description);
    formData.set("dueDate", values.dueDate);
    formData.set(
      "dueTime",
      values.hasDueTime
        ? dueTimePickerTo24({
            hour: values.dueTimeHour,
            minute: values.dueTimeMinute,
            period: values.dueTimePeriod,
          })
        : "",
    );
    formData.set("companyId", values.companyId ?? "");
    values.assigneeIds.forEach((assigneeId) => {
      formData.append("assigneeIds", assigneeId);
    });

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createOfficeTask(formData)
          : await updateOfficeTask(formData);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {showTrigger ? (
        <DialogTrigger
          render={
            <Button
              type="button"
              variant={triggerVariant}
              size={triggerSize}
              aria-label={mode === "create" ? "업무 등록" : "업무 수정"}
            />
          }
        >
          {mode === "create" ? (
            <>
              <Plus />
              업무 등록
            </>
          ) : (
            <Pencil className="size-4" />
          )}
        </DialogTrigger>
      ) : null}
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-lg">
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {mode === "create" ? "업무 등록" : "업무 수정"}
          </DialogTitle>
          <DialogDescription>
            {isAdmin
              ? "담당자는 사무소 직원 및 관리자에게 지정할 수 있으며, 여러 명을 선택할 수 있습니다."
              : "담당자는 본인만 지정할 수 있습니다."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col gap-4"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
          <div className="space-y-1.5">
            <FieldLabel htmlFor="office-task-title" required>
              제목
            </FieldLabel>
            <Input
              id="office-task-title"
              value={values.title}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              required
              maxLength={200}
              disabled={isPending}
            />
          </div>

          <SearchableCompanySelect
            id="office-task-company"
            companies={companies}
            value={values.companyId}
            onChange={(companyId) =>
              setValues((current) => ({ ...current, companyId }))
            }
            disabled={isPending}
          />

          <div className="space-y-1.5">
            <FieldLabel htmlFor="office-task-description">설명</FieldLabel>
            <NotesTextarea
              id="office-task-description"
              value={values.description}
              onChange={(description) =>
                setValues((current) => ({
                  ...current,
                  description,
                }))
              }
              disabled={isPending}
              className={textareaClassName}
            />
          </div>

          <div className="grid items-end gap-4 sm:grid-cols-2">
              <div className="min-w-0 space-y-1.5">
                <FieldLabel htmlFor="office-task-due-date" required>
                  마감일
                </FieldLabel>
                <DateInput
                  id="office-task-due-date"
                  value={values.dueDate}
                  onChange={(dueDate) =>
                    setValues((current) => ({ ...current, dueDate }))
                  }
                  required
                  disabled={isPending}
                />
              </div>

              {isAdmin ? (
                <MultiSelectFilter
                  className="min-w-0 w-full"
                  label="담당자"
                  triggerLabel="담당자"
                  selectedCount={values.assigneeIds.length}
                  open={assigneeMenuOpen}
                  onOpenChange={setAssigneeMenuOpen}
                  disabled={isPending}
                  contentClassName="w-72"
                  triggerClassName="w-full min-w-0 lg:w-full"
                >
                  <div className="max-h-56 space-y-0.5 overflow-y-auto">
                    {selectableStaff.map((user) => {
                      const checked = values.assigneeIds.includes(user.id);
                      return (
                        <label
                          key={user.id}
                          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                        >
                          <input
                            type="checkbox"
                            className="size-3.5 rounded border-input accent-primary"
                            checked={checked}
                            onChange={() => toggleAssignee(user.id)}
                          />
                          <span className="min-w-0 flex-1 truncate">
                            {user.name}
                            <span className="ml-1 text-muted-foreground">
                              ({getRoleLabel(user.role)})
                            </span>
                            {!user.isActive ? (
                              <span className="ml-1 text-muted-foreground">
                                · 비활성
                              </span>
                            ) : null}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </MultiSelectFilter>
              ) : (
                <div className="min-w-0 space-y-1.5">
                  <FieldLabel htmlFor="office-task-assignee-self">담당자</FieldLabel>
                  <Input
                    id="office-task-assignee-self"
                    value={
                      staffUsers.find((user) => user.id === currentUserId)?.name ??
                      "본인"
                    }
                    disabled
                    readOnly
                  />
                </div>
              )}
          </div>

          <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-3.5 rounded border-input accent-primary"
                  checked={values.hasDueTime}
                  disabled={isPending}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      hasDueTime: event.target.checked,
                    }))
                  }
                />
                시간 설정하기
              </label>
              <div className="grid grid-cols-3 gap-2">
                <select
                  id="office-task-due-period"
                  value={values.dueTimePeriod}
                  disabled={isPending || !values.hasDueTime}
                  className={selectClassName}
                  aria-label="마감 오전/오후"
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      dueTimePeriod: event.target.value as DueTimePeriod,
                    }))
                  }
                >
                  <option value="AM">오전</option>
                  <option value="PM">오후</option>
                </select>
                <select
                  id="office-task-due-hour"
                  value={values.dueTimeHour}
                  disabled={isPending || !values.hasDueTime}
                  className={selectClassName}
                  aria-label="마감 시"
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      dueTimeHour: event.target.value,
                    }))
                  }
                >
                  {DUE_TIME_HOURS.map((hour) => (
                    <option key={hour} value={hour}>
                      {hour}시
                    </option>
                  ))}
                </select>
                <select
                  id="office-task-due-minute"
                  value={values.dueTimeMinute}
                  disabled={isPending || !values.hasDueTime}
                  className={selectClassName}
                  aria-label="마감 분"
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      dueTimeMinute: event.target.value,
                    }))
                  }
                >
                  {DUE_TIME_MINUTES.map((minute) => (
                    <option key={minute} value={minute}>
                      {minute}분
                    </option>
                  ))}
                </select>
              </div>
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          </div>

          {mode === "edit" && task ? (
            <div className="shrink-0 border-t pt-4">
              <p className="mb-3 text-sm text-muted-foreground">
                업무를 삭제하면 복구할 수 없습니다.
              </p>
              <ConfirmDeleteDialog
                title="업무 삭제"
                description="이 업무를 삭제하면 복구할 수 없습니다. 계속하시겠습니까?"
                action={async (formData) => {
                  await deleteOfficeTask(formData);
                  setOpen(false);
                  router.refresh();
                }}
                hiddenFields={{ id: task.id }}
                triggerLabel="업무 삭제"
                confirmLabel="삭제 확인"
                requireTypedConfirmation
                disabled={isPending}
                iconTrigger={false}
              />
            </div>
          ) : null}

          <DialogFooter className="shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              취소
            </Button>
            <Button type="submit" disabled={isPending}>
              {mode === "create" ? "등록" : "저장"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
