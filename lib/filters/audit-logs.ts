import type {
  AuditLogActionFilter,
  AuditLogTableName,
} from "@/modules/audit-logs/labels";

export type AuditLogFilterValues = {
  actorIds: string[];
  actions: AuditLogActionFilter[];
  tableNames: AuditLogTableName[];
  createdAtFrom: string;
  createdAtTo: string;
  payloadQuery: string;
};

export const EMPTY_AUDIT_LOG_FILTERS: AuditLogFilterValues = {
  actorIds: [],
  actions: [],
  tableNames: [],
  createdAtFrom: "",
  createdAtTo: "",
  payloadQuery: "",
};

export function parseAuditFilterDate(value: string, endOfDay = false): Date | null {
  if (!value.trim()) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  if (endOfDay) {
    date.setUTCHours(23, 59, 59, 999);
  }

  return date;
}

export { summarizeAuditPayload } from "@/lib/format/audit-payload";
