import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type NotificationCountBadgeProps = {
  count: number;
  variant?: "registration" | "change";
  className?: string;
};

export function NotificationCountBadge({
  count,
  variant = "change",
  className,
}: NotificationCountBadgeProps) {
  if (count <= 0) {
    return null;
  }

  const badgeTone = "bg-brand-gold/85 text-sidebar hover:bg-brand-gold/85";

  return (
    <Badge
      className={cn(
        "font-semibold",
        variant === "registration" ? badgeTone : badgeTone,
        className,
      )}
    >
      {count}
    </Badge>
  );
}
