import type { Session } from "next-auth";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/db";
import type { UserRole } from "@/lib/generated/prisma/client";
import type { SessionRevokeReason } from "@/lib/auth/session-revoke-reasons";

export type { SessionRevokeReason } from "@/lib/auth/session-revoke-reasons";
export {
  SESSION_REVOKE_REASONS,
  getSessionRevokeMessage,
  isSessionRevokeReason,
} from "@/lib/auth/session-revoke-reasons";

type SessionUserSnapshot = {
  userId: string;
  role: UserRole;
  companyId: string | null;
};

export async function fetchSessionAuthority(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      companyId: true,
      isActive: true,
      company: {
        select: {
          deletedAt: true,
          isActive: true,
        },
      },
    },
  });
}

export function detectSessionAuthorityMismatch(
  sessionUser: SessionUserSnapshot,
  authority: NonNullable<Awaited<ReturnType<typeof fetchSessionAuthority>>>,
): SessionRevokeReason | null {
  if (!authority.isActive) {
    return "deactivated";
  }

  const sessionRole = sessionUser.role;
  const sessionCompanyId = sessionUser.companyId ?? null;
  const authorityCompanyId = authority.companyId ?? null;

  if (sessionRole !== authority.role) {
    return "role_changed";
  }

  if (sessionCompanyId !== authorityCompanyId) {
    return "company_removed";
  }

  if (authority.role === "CLIENT_ADMIN" && authorityCompanyId) {
    if (!authority.company) {
      return "company_removed";
    }

    if (authority.company.deletedAt !== null || !authority.company.isActive) {
      return "company_removed";
    }
  }

  return null;
}

export async function checkSessionAuthority(
  session: Session,
): Promise<SessionRevokeReason | null> {
  const authority = await fetchSessionAuthority(session.user.userId);

  if (!authority) {
    return "deleted";
  }

  return detectSessionAuthorityMismatch(
    {
      userId: session.user.userId,
      role: session.user.role,
      companyId: session.user.companyId,
    },
    authority,
  );
}

export function revokeSessionForAuthorityChange(
  reason: SessionRevokeReason,
): never {
  redirect(
    `/api/auth/revoke-session?reason=${encodeURIComponent(reason)}`,
  );
}
