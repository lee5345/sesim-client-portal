const koreanCollator = new Intl.Collator("ko");

export function compareKorean(a: string, b: string): number {
  return koreanCollator.compare(a, b);
}

export function sortByKoreanName<T>(
  items: readonly T[],
  getName: (item: T) => string,
): T[] {
  return [...items].sort((a, b) => compareKorean(getName(a), getName(b)));
}

import type { UserRole } from "@/lib/generated/prisma/client";

export function sortFirmStaffUsers<
  T extends { role: UserRole; name: string },
>(users: readonly T[]): T[] {
  return [...users].sort((a, b) => {
    const aIsAdmin = a.role === "FIRM_ADMIN";
    const bIsAdmin = b.role === "FIRM_ADMIN";
    if (aIsAdmin !== bIsAdmin) {
      return aIsAdmin ? -1 : 1;
    }
    return compareKorean(a.name, b.name);
  });
}

export function sortByActivityThenKoreanName<
  T extends { isActive: boolean; name: string },
>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => {
    if (a.isActive !== b.isActive) {
      return a.isActive ? -1 : 1;
    }
    return compareKorean(a.name, b.name);
  });
}

export const sortCompaniesByActivity = sortByActivityThenKoreanName;
