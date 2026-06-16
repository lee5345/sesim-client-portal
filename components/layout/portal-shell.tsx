import type { ReactNode } from "react";

import { FirmBrandLockup } from "@/components/layout/firm-brand-lockup";
import { UserChip } from "@/components/layout/user-chip";
import { SidebarNav, type SidebarNavItem } from "@/components/layout/sidebar-nav";

type PortalShellProps = {
  firmName: string;
  firmTagline?: string;
  contextLabel: string;
  contextValue: string;
  navItems: SidebarNavItem[];
  userName: string;
  userRoleLabel: string;
  avatarText: string;
  children: ReactNode;
};

export function PortalShell({
  firmName,
  firmTagline,
  contextLabel,
  contextValue,
  navItems,
  userName,
  userRoleLabel,
  avatarText,
  children,
}: PortalShellProps) {
  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-gradient-to-b from-[oklch(0.28_0.06_252)] to-sidebar text-sidebar-foreground shadow-xl shadow-sidebar/20">
        <div className="relative overflow-hidden border-b border-sidebar-border px-5 py-6">
          <div
            className="pointer-events-none absolute -right-6 -top-6 size-28 rounded-full opacity-20"
            style={{
              background:
                "radial-gradient(circle, var(--brand-gold) 0%, transparent 70%)",
            }}
          />
          <FirmBrandLockup firmName={firmName} firmTagline={firmTagline} />
          <div className="relative mt-5 rounded-lg border border-sidebar-border/80 bg-sidebar-accent/50 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-muted">
              {contextLabel}
            </p>
            <p className="mt-0.5 truncate text-sm font-medium text-sidebar-foreground">
              {contextValue}
            </p>
          </div>
        </div>

        <SidebarNav items={navItems} />
        <UserChip
          name={userName}
          roleLabel={userRoleLabel}
          avatarText={avatarText}
        />
      </aside>

      <div className="ml-64 flex min-h-screen min-w-0 flex-1 flex-col">
        <main className="portal-main min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
