import { requireAuth } from "@/lib/auth/guards";
import {
  getAvatarInitials,
  getGivenName,
  getRoleLabel,
} from "@/lib/auth/roles";
import { getFirmName, getFirmTagline } from "@/lib/config/branding";
import { getPendingRegistrationRequestCount } from "@/modules/companies/companies";
import { PortalShell } from "@/components/layout/portal-shell";

export default async function FirmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth(["FIRM_STAFF", "FIRM_ADMIN"]);
  const pendingCount = await getPendingRegistrationRequestCount();

  const navItems = [
    { href: "/firm/dashboard", label: "대시보드", icon: "layout-dashboard" as const },
    {
      href: "/firm/companies",
      label: "고객사 목록",
      icon: "building2" as const,
      badge: pendingCount,
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
            icon: "users" as const,
          },
        ]
      : []),
  ];

  const givenName = getGivenName(session.user.name ?? "");

  return (
    <PortalShell
      firmName={getFirmName()}
      firmTagline={getFirmTagline()}
      contextLabel="담당 사무소"
      contextValue={getFirmName()}
      navItems={navItems}
      userName={session.user.name ?? "사용자"}
      userRoleLabel={getRoleLabel(session.user.role)}
      avatarText={getAvatarInitials(givenName)}
    >
      {children}
    </PortalShell>
  );
}
