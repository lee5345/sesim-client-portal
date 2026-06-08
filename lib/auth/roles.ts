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
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

/** First given name for firm sidebar avatar (e.g. 홍길동 → 길) */
export function getGivenName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    return parts[1];
  }
  if (trimmed.length >= 2) {
    return trimmed.slice(1);
  }
  return trimmed;
}
