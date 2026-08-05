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

const PREFERRED_PREVIEW_KEYS = [
  "name",
  "employeeName",
  "email",
  "employeeNumber",
  "phone",
  "mode",
  "created",
  "skipped",
  "sourcePeriod",
  "targetPeriod",
] as const;

function formatPreviewValue(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return null;
}

/** Compact one-line summary of an audit payload for table cells. */
export function summarizeAuditPayload(payload: unknown): string {
  if (payload === null || payload === undefined) {
    return "—";
  }

  if (typeof payload !== "object" || Array.isArray(payload)) {
    return formatPreviewValue(payload) ?? "—";
  }

  const record = payload as Record<string, unknown>;
  const values: string[] = [];
  const seen = new Set<string>();

  for (const key of PREFERRED_PREVIEW_KEYS) {
    if (!(key in record)) continue;
    const formatted = formatPreviewValue(record[key]);
    if (formatted === null) continue;
    values.push(formatted);
    seen.add(key);
  }

  for (const [key, value] of Object.entries(record)) {
    if (seen.has(key)) continue;
    const formatted = formatPreviewValue(value);
    if (formatted === null) continue;
    values.push(formatted);
  }

  if (values.length === 0) {
    return "—";
  }

  return values.join(", ");
}
