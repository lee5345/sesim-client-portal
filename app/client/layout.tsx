import { requireAuth } from "@/lib/auth/guards";
import {
  getAvatarInitials,
  getRoleLabel,
} from "@/lib/auth/roles";
import { getFirmName, getFirmTagline } from "@/lib/config/branding";
import { prisma } from "@/lib/db/db";
import { getInitialRealtimeSyncState } from "@/modules/realtime/initial-state";
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

  const realtimeState = await getInitialRealtimeSyncState({
    userId: session.user.userId,
    role: session.user.role,
    companyId,
  });

  const navItems = [
    { href: "/client/dashboard", label: "대시보드", icon: "layout-dashboard" as const },
    { href: "/client/new-hires", label: "입사자 정보", icon: "user-plus" as const },
    { href: "/client/terminations", label: "퇴사자 정보", icon: "user-minus" as const },
    { href: "/client/daily-workers", label: "일용직 정보", icon: "calendar-days" as const },
    { href: "/client/compensation-changes", label: "급여변경 정보", icon: "wallet" as const },
    { href: "/client/compensation-info", label: "상세급여 정보", icon: "calculator" as const },
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
      realtimeState={realtimeState}
    >
      {children}
    </PortalShell>
  );
}
