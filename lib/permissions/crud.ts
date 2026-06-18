import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/guards";
import type { UserRole } from "@/lib/generated/prisma/client";

export const DATA_EDIT_ROLES = [
  "CLIENT_ADMIN",
  "FIRM_STAFF",
  "FIRM_ADMIN",
] as const satisfies readonly UserRole[];

export type DataEditSession = Awaited<ReturnType<typeof requireDataEditAuth>>;

export async function requireDataEditAuth() {
  return requireAuth([...DATA_EDIT_ROLES]);
}

export function isFirmRole(role: UserRole): boolean {
  return role === "FIRM_STAFF" || role === "FIRM_ADMIN";
}

export function resolveCompanyId(
  session: DataEditSession,
  explicitCompanyId?: string | null,
): string {
  if (isFirmRole(session.user.role)) {
    if (!explicitCompanyId) {
      throw new Error("고객사 정보가 필요합니다.");
    }
    return explicitCompanyId;
  }

  const companyId = session.user.companyId;
  if (!companyId) {
    throw new Error("소속 회사 정보가 없습니다.");
  }

  if (explicitCompanyId && explicitCompanyId !== companyId) {
    redirect("/unauthorized");
  }

  return companyId;
}

export function parseOptionalCompanyId(
  formData: FormData,
): string | null | undefined {
  const value = formData.get("companyId");
  if (value === null || value === undefined) {
    return undefined;
  }
  const companyId = String(value).trim();
  return companyId.length > 0 ? companyId : undefined;
}
