import type { OfficeTaskTableRow } from "@/lib/office-tasks/types";

export const EMPTY_TASK_CELL = "—";
export const UNSPECIFIED_COMPANY_LABEL = "고객사 미특정";

export function formatTaskCompanyName(company: { name: string } | null) {
  return company?.name ?? UNSPECIFIED_COMPANY_LABEL;
}

export function formatTaskCompanyBadgeLabel(company: { name: string } | null) {
  const name = formatTaskCompanyName(company);
  if (name.length <= 10) {
    return name;
  }

  return `${name.slice(0, 10)}...`;
}

export function formatAssigneeNames(assignees: { name: string }[]) {
  if (assignees.length === 0) {
    return EMPTY_TASK_CELL;
  }

  return assignees.map((assignee) => assignee.name).join(", ");
}

export function isCompletedOfficeTask(task: OfficeTaskTableRow) {
  return Boolean(task.completedAtIso);
}
