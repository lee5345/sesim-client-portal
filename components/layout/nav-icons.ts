import {
  ArrowLeftRight,
  Building2,
  Calculator,
  CalendarDays,
  CalendarOff,
  ClipboardList,
  DollarSign,
  LayoutDashboard,
  Settings,
  UserCog,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";

export const NAV_ICONS = {
  "layout-dashboard": LayoutDashboard,
  building2: Building2,
  "arrow-left-right": ArrowLeftRight,
  "dollar-sign": DollarSign,
  "clipboard-list": ClipboardList,
  calculator: Calculator,
  "calendar-days": CalendarDays,
  "calendar-off": CalendarOff,
  users: Users,
  "user-cog": UserCog,
  "user-plus": UserPlus,
  "user-minus": UserMinus,
  settings: Settings,
} as const;

export type NavIconName = keyof typeof NAV_ICONS;
