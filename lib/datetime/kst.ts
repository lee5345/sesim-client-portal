const KST_OFFSET = "+09:00";

const DATE_STRING_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_STRING_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const DUE_TIME_HOURS = [
  "12",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
] as const;

export const DUE_TIME_MINUTES = [
  "00",
  "05",
  "10",
  "15",
  "20",
  "25",
  "30",
  "35",
  "40",
  "45",
  "50",
  "55",
] as const;

export type DueTimePeriod = "AM" | "PM";

export type DueTimePickerValue = {
  hour: string;
  minute: string;
  period: DueTimePeriod;
};

export const DEFAULT_DUE_TIME_PICKER: DueTimePickerValue = {
  hour: "9",
  minute: "00",
  period: "AM",
};

export function dueTime24ToPicker(dueTime24: string): DueTimePickerValue {
  const match = TIME_STRING_REGEX.exec(dueTime24);
  if (!match) {
    return DEFAULT_DUE_TIME_PICKER;
  }

  const hour24 = Number(match[1]);
  const minute = match[2];
  let hour12 = hour24 % 12;
  if (hour12 === 0) {
    hour12 = 12;
  }

  return {
    hour: String(hour12),
    minute,
    period: hour24 >= 12 ? "PM" : "AM",
  };
}

export function dueTimePickerTo24(value: DueTimePickerValue): string {
  let hour24 = Number(value.hour) % 12;
  if (value.period === "PM") {
    hour24 += 12;
  }

  return `${String(hour24).padStart(2, "0")}:${value.minute}`;
}

export function isValidKstTimeString(value: string): boolean {
  return TIME_STRING_REGEX.test(value);
}

export function parseKstDueAt(input: {
  dueDate: string;
  dueTime?: string | null;
}): { dueAt: Date; hasDueTime: boolean } {
  if (!DATE_STRING_REGEX.test(input.dueDate)) {
    throw new Error("날짜 형식은 YYYY-MM-DD여야 합니다.");
  }

  const dueTime = input.dueTime?.trim();
  if (dueTime) {
    if (!isValidKstTimeString(dueTime)) {
      throw new Error("시간 형식은 HH:mm이어야 합니다.");
    }
    return {
      dueAt: new Date(`${input.dueDate}T${dueTime}:00${KST_OFFSET}`),
      hasDueTime: true,
    };
  }

  return {
    dueAt: new Date(`${input.dueDate}T23:59:59.999${KST_OFFSET}`),
    hasDueTime: false,
  };
}

export function formatDueDateInput(dueAt: Date, hasDueTime: boolean): string {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  });
  const datePart = formatter.format(dueAt);

  if (hasDueTime) {
    return datePart;
  }

  return datePart;
}

export function formatDueTimeInput(dueAt: Date): string {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  });
  return formatter.format(dueAt);
}

export function formatKstDateKey(date: Date): string {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  });
  return formatter.format(date);
}

export function isOverdueInKst(dueAt: Date, hasDueTime: boolean, now = new Date()): boolean {
  if (hasDueTime) {
    return dueAt.getTime() < now.getTime();
  }

  const dueDateKey = formatKstDateKey(dueAt);
  const todayKey = formatKstDateKey(now);
  return dueDateKey < todayKey;
}

export function kstDateRangeToUtcBounds(from: string, to: string): {
  from?: Date;
  to?: Date;
} {
  const result: { from?: Date; to?: Date } = {};

  if (DATE_STRING_REGEX.test(from)) {
    result.from = new Date(`${from}T00:00:00.000${KST_OFFSET}`);
  }

  if (DATE_STRING_REGEX.test(to)) {
    result.to = new Date(`${to}T23:59:59.999${KST_OFFSET}`);
  }

  return result;
}
