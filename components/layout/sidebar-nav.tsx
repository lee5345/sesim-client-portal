"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Calculator,
  ClipboardList,
  LayoutDashboard,
  Settings,
  UserMinus,
  UserPlus,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const NAV_ICONS = {
  "layout-dashboard": LayoutDashboard,
  building2: Building2,
  "clipboard-list": ClipboardList,
  calculator: Calculator,
  users: Users,
  "user-plus": UserPlus,
  "user-minus": UserMinus,
  wallet: Wallet,
  settings: Settings,
} as const;

export type NavIconName = keyof typeof NAV_ICONS;

export type SidebarNavItem = {
  href: string;
  label: string;
  icon: NavIconName;
  disabled?: boolean;
  badge?: number;
};

type SidebarNavProps = {
  items: SidebarNavItem[];
};

export function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
      {items.map((item) => {
        const isActive =
          !item.disabled &&
          (pathname === item.href || pathname.startsWith(`${item.href}/`));
        const Icon: LucideIcon = NAV_ICONS[item.icon];

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
            {item.badge != null && item.badge > 0 ? (
              <Badge className="bg-brand-gold text-sidebar font-semibold">
                {item.badge}
              </Badge>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
