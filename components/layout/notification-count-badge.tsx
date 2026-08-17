import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type NotificationCountBadgeProps = {
  count: number;
  variant?: "registration" | "change" | "overdue";
  className?: string;
  "aria-label"?: string;
};

const BADGE_TONE = {
  registration: "bg-brand-gold/85 text-sidebar hover:bg-brand-gold/85",
  change: "bg-brand-gold/85 text-sidebar hover:bg-brand-gold/85",
  overdue: "bg-destructive text-white hover:bg-destructive",
} as const;

export function NotificationCountBadge({
  count,
  variant = "change",
  className,
  "aria-label": ariaLabel,
}: NotificationCountBadgeProps) {
  if (count <= 0) {
    return null;
  }

  return (
    <Badge
      className={cn("font-semibold", BADGE_TONE[variant], className)}
      aria-label={ariaLabel}
    >
      {count}
    </Badge>
  );
}
