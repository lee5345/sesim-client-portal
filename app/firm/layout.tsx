import { requireAuth } from "@/lib/auth/guards";
import { getAvatarInitials, getRoleLabel } from "@/lib/auth/roles";
import { getFirmName, getFirmTagline } from "@/lib/config/branding";
import { getPendingRegistrationRequestCount } from "@/modules/companies/companies";
import { getInitialRealtimeSyncState } from "@/modules/realtime/initial-state";
import { PortalShell } from "@/components/layout/portal-shell";

export default async function FirmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth(["FIRM_STAFF", "FIRM_ADMIN"]);
  const [pendingCount, realtimeState] = await Promise.all([
    getPendingRegistrationRequestCount(),
    getInitialRealtimeSyncState({
      userId: session.user.userId,
      role: session.user.role,
      companyId: session.user.companyId,
    }),
  ]);

  const navItems = [
    { href: "/firm/dashboard", label: "대시보드", icon: "layout-dashboard" as const },
    { href: "/firm/companies", label: "고객사 목록", icon: "building2" as const },
    {
      href: "/firm/client-accounts",
      label: "고객 계정 관리",
      icon: "users" as const,
      badge: pendingCount,
      badgeVariant: "registration" as const,
    },
    {
      href: "/firm/calculator",
      label: "사대보험 계산기",
      icon: "calculator" as const,
      disabled: true,
    },
    ...(session.user.role === "FIRM_ADMIN"
      ? [
          {
            href: "/firm/admin/users",
            label: "직원 계정 관리",
            icon: "user-cog" as const,
          },
        ]
      : []),
  ];

  return (
    <PortalShell
      firmName={getFirmName()}
      firmTagline={getFirmTagline()}
      contextLabel="담당 사무소"
      contextValue={getFirmName()}
      navItems={navItems}
      userName={session.user.name ?? "사용자"}
      userRoleLabel={getRoleLabel(session.user.role)}
      avatarText={getAvatarInitials(session.user.name ?? "")}
      realtimeState={realtimeState}
    >
      {children}
    </PortalShell>
  );
}
