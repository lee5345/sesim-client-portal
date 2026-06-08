import { requireAuth } from "@/lib/auth/guards";
import {
  getAvatarInitials,
  getRoleLabel,
} from "@/lib/auth/roles";
import { getFirmName, getFirmTagline } from "@/lib/config/branding";
import { prisma } from "@/lib/db/db";
import { PortalShell } from "@/components/layout/portal-shell";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth("CLIENT_ADMIN");
  const companyId = session.user.companyId;

  const company = companyId
    ? await prisma.company.findUnique({
        where: { id: companyId },
        select: { name: true },
      })
    : null;

  const navItems = [
    { href: "/client/dashboard", label: "대시보드", icon: "layout-dashboard" as const },
    { href: "/client/new-hires", label: "입사자 정보", icon: "user-plus" as const },
    { href: "/client/terminations", label: "퇴사자 정보", icon: "user-minus" as const },
    {
      href: "/client/compensation-changes",
      label: "급여변경 내역",
      icon: "wallet" as const,
      disabled: true,
    },
    { href: "/client/settings", label: "설정", icon: "settings" as const },
  ];

  return (
    <PortalShell
      firmName={getFirmName()}
      firmTagline={getFirmTagline()}
      contextLabel="소속 회사"
      contextValue={company?.name ?? "—"}
      navItems={navItems}
      userName={session.user.name ?? "사용자"}
      userRoleLabel={getRoleLabel(session.user.role)}
      avatarText={getAvatarInitials(session.user.name ?? "")}
    >
      {children}
    </PortalShell>
  );
}
