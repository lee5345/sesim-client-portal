"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type LucideIcon } from "lucide-react";

import { NotificationCountBadge } from "@/components/layout/notification-count-badge";
import { NAV_ICONS, type NavIconName } from "@/components/layout/nav-icons";
import { useOptionalRealtimeSync } from "@/components/layout/realtime-sync-provider";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type { NavIconName };
export { NAV_ICONS };

export type SidebarNavItem = {
  href: string;
  label: string;
  icon: NavIconName;
  disabled?: boolean;
  badge?: number;
  badgeVariant?: "registration" | "change";
};

type SidebarNavProps = {
  items: SidebarNavItem[];
};

export function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname();
  const realtime = useOptionalRealtimeSync();

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
      {items.map((item) => {
        const isActive =
          !item.disabled &&
          (pathname === item.href || pathname.startsWith(`${item.href}/`));
        const Icon: LucideIcon = NAV_ICONS[item.icon];
        const liveBadge = realtime?.getNavBadge(item.href);
        const badgeCount = liveBadge ?? item.badge ?? 0;
        const badgeVariant =
          item.href === "/firm/client-accounts" ? "registration" : "change";

        if (item.disabled) {
          return (
            <span
              key={item.label}
              className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-muted/60"
              aria-disabled
            >
              <Icon className="size-4 shrink-0 opacity-50" />
              <span className="flex-1">{item.label}</span>
              <Badge
                variant="secondary"
                className="bg-sidebar-accent/50 text-[10px] text-sidebar-muted"
              >
                준비 중
              </Badge>
            </span>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              isActive
                ? "border-l-2 border-brand-gold bg-sidebar-accent pl-[10px] font-medium text-sidebar-foreground shadow-sm"
                : "text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="flex-1">{item.label}</span>
            <NotificationCountBadge
              count={badgeCount}
              variant={item.badgeVariant ?? badgeVariant}
            />
          </Link>
        );
      })}
    </nav>
  );
}
