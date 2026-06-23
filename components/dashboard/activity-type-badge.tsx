import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const DASHBOARD_ACTIVITY_TYPES = ["입사자", "퇴사자"] as const;

export type DashboardActivityType = (typeof DASHBOARD_ACTIVITY_TYPES)[number];

const ACTIVITY_TYPE_BADGE_CLASS: Record<DashboardActivityType, string> = {
  입사자: "border-emerald-200 bg-emerald-50 text-emerald-700",
  퇴사자: "border-red-200 bg-red-50 text-red-700",
};

type ActivityTypeBadgeProps = {
  type: DashboardActivityType;
};

export function ActivityTypeBadge({ type }: ActivityTypeBadgeProps) {
  return (
    <Badge variant="outline" className={cn(ACTIVITY_TYPE_BADGE_CLASS[type])}>
      {type}
    </Badge>
  );
}
