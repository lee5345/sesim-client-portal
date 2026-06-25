import type { DailyHourFieldName } from "@/modules/daily-workers/constants";
import { DAILY_HOUR_DAY_COUNT } from "@/modules/daily-workers/constants";

export type DailyHoursInput = Record<DailyHourFieldName, number | null>;

export function createEmptyDailyHours(): DailyHoursInput {
  return Object.fromEntries(
    Array.from({ length: DAILY_HOUR_DAY_COUNT }, (_, index) => [
      `hoursDay${index + 1}`,
      null,
    ]),
  ) as DailyHoursInput;
}

export function calculateDaysWorked(hours: DailyHoursInput): number {
  return Object.values(hours).filter((value) => value !== null && value > 0)
    .length;
}

export function calculateAvgHoursPerDay(hours: DailyHoursInput): number {
  const workedHours = Object.values(hours).filter(
    (value): value is number => value !== null && value > 0,
  );

  if (workedHours.length === 0) {
    return 0;
  }

  const total = workedHours.reduce((sum, value) => sum + value, 0);
  return Math.round(total / workedHours.length);
}

export function formatDailyHours(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }

  const rounded = Math.round(value * 10) / 10;
  return rounded.toFixed(1);
}

export function formatDailyHoursInput(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function serializeDailyHoursValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function getDailyHourDayNumbers(): number[] {
  return Array.from({ length: DAILY_HOUR_DAY_COUNT }, (_, index) => index + 1);
}

export function formatDailyHourDayLabel(day: number): string {
  return `${day}일`;
}

export function parseDailyHoursInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (!/^\d+(\.\d)?$/.test(trimmed)) {
    return null;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 24) {
    return null;
  }

  return Math.round(parsed * 10) / 10;
}

export function isValidDailyHoursInput(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return true;
  }

  return /^\d+(\.\d)?$/.test(trimmed) && parseDailyHoursInput(trimmed) !== null;
}
