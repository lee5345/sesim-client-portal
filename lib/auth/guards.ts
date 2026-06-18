import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { UserRole } from "@/lib/generated/prisma/client";
import {
  checkSessionAuthority,
  revokeSessionForAuthorityChange,
} from "@/lib/auth/session-authority";

export async function requireValidSession() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const authorityMismatch = await checkSessionAuthority(session);
  if (authorityMismatch) {
    await revokeSessionForAuthorityChange(authorityMismatch);
  }

  return session;
}

export async function requireAuth(
  requiredRole?: UserRole | UserRole[],
  opts?: { allowMustChangePassword?: boolean },
) {
  const session = await requireValidSession();

  if (!opts?.allowMustChangePassword && session.user.mustChangePassword) {
    redirect("/change-password");
  }

  if (!requiredRole) {
    return session;
  }

  const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  if (!allowed.includes(session.user.role)) {
    redirect("/unauthorized");
  }

  return session;
}

