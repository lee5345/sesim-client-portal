export function formatDecimalHours(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }

  const normalized = Number.isFinite(value) ? value : 0;
  return normalized.toFixed(3);
}

export function splitDecimalHours(value: number | null | undefined): {
  hours: string;
  minutes: string;
} {
  if (value === null || value === undefined) {
    return { hours: "", minutes: "" };
  }

  const wholeHours = Math.floor(value);
  const minutes = Math.round((value - wholeHours) * 60);

  return {
    hours: String(wholeHours),
    minutes: String(minutes),
  };
}

export function formatUnusedLeaveAmount(
  unit: "DAYS" | "HOURS" | null | undefined,
  amount: number | null | undefined,
): string {
  if (!unit || amount === null || amount === undefined) {
    return "—";
  }

  if (unit === "DAYS") {
    return `${amount}일`;
  }

  const rounded = Math.round(amount * 10) / 10;
  return `${rounded}시간`;
}
