import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type StatCardProps = {
  title: string;
  value: ReactNode;
  description?: string;
  disabled?: boolean;
  action?: ReactNode;
};

export function StatCard({
  title,
  value,
  description,
  disabled,
  action,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "transition-shadow hover:shadow-sm",
        disabled && "opacity-60",
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {action}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {description ? (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
