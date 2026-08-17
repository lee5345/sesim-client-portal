export const TASK_MANAGER_PATH = "/firm/task-manager";

export type OfficeTaskDialogMode = "view" | "edit";

export function getOfficeTaskManagerHref(
  taskId?: string,
  mode: OfficeTaskDialogMode = "view",
) {
  if (!taskId) {
    return TASK_MANAGER_PATH;
  }

  const params = new URLSearchParams({ task: taskId });
  if (mode === "edit") {
    params.set("mode", "edit");
  }

  return `${TASK_MANAGER_PATH}?${params.toString()}`;
}

export function parseOfficeTaskDialogFromSearchParams(
  searchParams: Pick<URLSearchParams, "get">,
): { taskId: string | null; mode: OfficeTaskDialogMode | null } {
  const taskId = searchParams.get("task");
  if (!taskId) {
    return { taskId: null, mode: null };
  }

  return {
    taskId,
    mode: searchParams.get("mode") === "edit" ? "edit" : "view",
  };
}
