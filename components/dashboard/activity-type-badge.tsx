import Link from "next/link";
import {
  ArrowLeftRight,
  CalendarDays,
  CalendarOff,
  Calculator,
  DollarSign,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";

export const DASHBOARD_ACTIVITY_TYPES = [
  "입사자",
  "퇴사자",
  "일용직",
  "급여변경",
  "상세급여",
  "사업소득",
  "휴직자 등",
  "피부양자",
] as const;

export type DashboardActivityType = (typeof DASHBOARD_ACTIVITY_TYPES)[number];

export const DASHBOARD_ACTIVITY_MODULE_PATHS: Record<
  DashboardActivityType,
  string
> = {
  입사자: "new-hires",
  퇴사자: "terminations",
  일용직: "daily-workers",
  급여변경: "compensation-changes",
  상세급여: "compensation-info",
  사업소득: "business-income",
  "휴직자 등": "leave-records",
  피부양자: "dependents",
};

const MONTHLY_SCOPED_ACTIVITY_TYPES = [
  "일용직",
  "상세급여",
  "사업소득",
] as const satisfies readonly DashboardActivityType[];

type MonthlyScopedActivityType = (typeof MONTHLY_SCOPED_ACTIVITY_TYPES)[number];

function isMonthlyScopedActivityType(
  type: DashboardActivityType,
): type is MonthlyScopedActivityType {
  return (MONTHLY_SCOPED_ACTIVITY_TYPES as readonly string[]).includes(type);
}

const ACTIVITY_TYPE_META: Record<
  DashboardActivityType,
  {
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
  }
> = {
  입사자: { label: "입사자", Icon: UserPlus },
  퇴사자: { label: "퇴사자", Icon: UserMinus },
  일용직: { label: "일용직", Icon: CalendarDays },
  급여변경: { label: "급여변경", Icon: ArrowLeftRight },
  상세급여: { label: "상세급여", Icon: Calculator },
  사업소득: { label: "사업소득", Icon: DollarSign },
  "휴직자 등": { label: "휴직자 등", Icon: CalendarOff },
  피부양자: { label: "피부양자", Icon: Users },
};

export function getDashboardActivityHref(input: {
  type: DashboardActivityType;
  mode: "client" | "firm";
  companyId?: string;
  year?: number;
  month?: number;
}) {
  const modulePath = DASHBOARD_ACTIVITY_MODULE_PATHS[input.type];
  const params = new URLSearchParams();

  if (input.mode === "firm") {
    if (!input.companyId) {
      return undefined;
    }
    params.set("tab", modulePath);
    appendMonthScope(params, input);
    return `/firm/companies/${input.companyId}?${params.toString()}`;
  }

  appendMonthScope(params, input);
  const query = params.toString();
  return query ? `/client/${modulePath}?${query}` : `/client/${modulePath}`;
}

function appendMonthScope(
  params: URLSearchParams,
  input: { type: DashboardActivityType; year?: number; month?: number },
) {
  if (!isMonthlyScopedActivityType(input.type)) {
    return;
  }
  if (input.year == null || input.month == null) {
    return;
  }
  params.set("year", String(input.year));
  params.set("month", String(input.month));
}

type ActivityTypeBadgeProps = {
  type: DashboardActivityType;
  href?: string;
};

export function ActivityTypeBadge({ type, href }: ActivityTypeBadgeProps) {
  const { label, Icon } = ACTIVITY_TYPE_META[type];

  const badge = (
    <Badge
      variant="outline"
      className="h-6 gap-1.5 rounded-full border-border/70 bg-muted/60 px-2.5 text-xs text-foreground transition-colors hover:bg-muted"
    >
      <Icon className="size-3.5" />
      {label}
    </Badge>
  );

  if (!href) {
    return badge;
  }

  return (
    <Link href={href} className="inline-flex">
      {badge}
    </Link>
  );
}
