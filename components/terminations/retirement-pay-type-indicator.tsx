import { Badge } from "@/components/ui/badge";
import type { RetirementPayType } from "@/lib/generated/prisma/client";
import { cn } from "@/lib/utils";
import { RETIREMENT_PAY_TYPE_LABELS } from "@/modules/terminations/constants";

type RetirementPayTypeIndicatorProps = {
  type: RetirementPayType;
  className?: string;
};

export function RetirementPayTypeIndicator({
  type,
  className,
}: RetirementPayTypeIndicatorProps) {
  return (
    <Badge
      variant={type === "NOT_APPLICABLE" ? "secondary" : "outline"}
      className={cn(className)}
    >
      {RETIREMENT_PAY_TYPE_LABELS[type]}
    </Badge>
  );
}
