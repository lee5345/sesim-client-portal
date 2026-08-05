function pad(value: number, length = 2): string {
  return String(value).padStart(length, "0");
}

/** Formats AuditLog.createdAt as stored wall-clock: `YYYY-MM-DD HH:mm:ss.SSS`. */
export function formatAuditTimestamp(date: Date | string): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return [
    `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}`,
    `${pad(value.getUTCHours())}:${pad(value.getUTCMinutes())}:${pad(value.getUTCSeconds())}.${pad(value.getUTCMilliseconds(), 3)}`,
  ].join(" ");
}
