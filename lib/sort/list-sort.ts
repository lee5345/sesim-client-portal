import { compareKorean } from "@/lib/sort/korean";

export type ListSortMode = "default" | "createdAt";

function toTime(value: Date | string | null | undefined): number | null {
  if (value == null) {
    return null;
  }

  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isNaN(time) ? null : time;
  }

  const time = Date.parse(value);
  return Number.isNaN(time) ? null : time;
}

export function compareTimestamps(
  a: Date | string | null | undefined,
  b: Date | string | null | undefined,
  direction: "asc" | "desc",
): number {
  const aTime = toTime(a);
  const bTime = toTime(b);

  if (aTime == null && bTime == null) {
    return 0;
  }
  if (aTime == null) {
    return 1;
  }
  if (bTime == null) {
    return -1;
  }

  const diff = aTime - bTime;
  return direction === "asc" ? diff : -diff;
}

export function sortListRows<T extends { createdAt: Date | string }>(
  items: readonly T[],
  mode: ListSortMode,
  compareDefault: (a: T, b: T) => number,
): T[] {
  const compare =
    mode === "createdAt"
      ? (a: T, b: T) => {
          const byCreated = compareTimestamps(a.createdAt, b.createdAt, "desc");
          if (byCreated !== 0) {
            return byCreated;
          }
          return compareDefault(a, b);
        }
      : compareDefault;

  return [...items].sort(compare);
}

export function compareNameAscThenCreatedAtAsc<
  T extends { name: string; createdAt: Date | string },
>(a: T, b: T): number {
  const byName = compareKorean(a.name, b.name);
  if (byName !== 0) {
    return byName;
  }
  return compareTimestamps(a.createdAt, b.createdAt, "asc");
}
