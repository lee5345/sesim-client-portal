export const AUDIT_ACTION_OPTIONS = ["CREATE", "UPDATE", "DELETE"] as const;

export type AuditLogActionFilter = (typeof AUDIT_ACTION_OPTIONS)[number];

export const AUDIT_ACTION_LABELS: Record<AuditLogActionFilter, string> = {
  CREATE: "생성",
  UPDATE: "수정",
  DELETE: "삭제",
};

export const AUDIT_TABLE_NAME_OPTIONS = [
  "new_hires",
  "terminations",
  "daily_workers",
  "compensation_changes",
  "compensation_infos",
  "business_incomes",
  "leave_records",
  "dependent_records",
] as const;

export type AuditLogTableName = (typeof AUDIT_TABLE_NAME_OPTIONS)[number];

export const AUDIT_TABLE_NAME_LABELS: Record<AuditLogTableName, string> = {
  new_hires: "입사자 정보",
  terminations: "퇴사자 정보",
  daily_workers: "일용직 정보",
  compensation_changes: "급여변경 정보",
  compensation_infos: "상세급여 정보",
  business_incomes: "사업소득 정보",
  leave_records: "휴직자 등 정보",
  dependent_records: "피부양자 정보",
};

export function getAuditActionLabel(action: string): string {
  if (action in AUDIT_ACTION_LABELS) {
    return AUDIT_ACTION_LABELS[action as AuditLogActionFilter];
  }
  return action;
}

export function getAuditTableNameLabel(tableName: string): string {
  if (tableName in AUDIT_TABLE_NAME_LABELS) {
    return AUDIT_TABLE_NAME_LABELS[tableName as AuditLogTableName];
  }
  return tableName;
}
