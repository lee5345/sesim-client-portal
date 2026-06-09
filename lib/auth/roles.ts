import type { UserRole } from "@/lib/generated/prisma/client";

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case "CLIENT_ADMIN":
      return "고객사 관리자";
    case "FIRM_STAFF":
      return "사무소 직원";
    case "FIRM_ADMIN":
      return "사무소 관리자";
    default:
      return role;
  }
}

export function getAvatarInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  if (trimmed.length === 1) return trimmed;
  return trimmed.slice(-2);
}
