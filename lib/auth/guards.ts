import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { UserRole } from "@/lib/generated/prisma/client";
import { ForbiddenError } from "@/lib/auth/errors";

export async function requireAuth(
  requiredRole?: UserRole | UserRole[],
  opts?: { allowMustChangePassword?: boolean },
) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!opts?.allowMustChangePassword && session.user.mustChangePassword) {
    redirect("/change-password");
  }

  if (!requiredRole) {
    return session;
  }

  const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  if (!allowed.includes(session.user.role)) {
    throw new ForbiddenError("권한이 없습니다.");
  }

  return session;
}

