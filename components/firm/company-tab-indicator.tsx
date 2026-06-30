"use client";

import { NotificationCountBadge } from "@/components/layout/notification-count-badge";
import { Badge } from "@/components/ui/badge";
import { useRealtimeSync } from "@/components/layout/realtime-sync-provider";
import type { TenantChangeEntityType } from "@/lib/generated/prisma/client";

type CompanyTabIndicatorProps = {
  companyId: string;
  entityType?: TenantChangeEntityType;
  totalCount: number;
};

export function CompanyTabIndicator({
  companyId,
  entityType,
  totalCount,
}: CompanyTabIndicatorProps) {
  const { getCompanyModuleBadge } = useRealtimeSync();
  const unreadCount = entityType ? getCompanyModuleBadge(companyId, entityType) : 0;

  if (unreadCount > 0) {
    return (
      <span className="ml-2 inline-flex items-center">
        <NotificationCountBadge count={unreadCount} variant="change" />
      </span>
    );
  }

  return (
    <Badge variant="secondary" className="ml-2">
      {totalCount}
    </Badge>
  );
}

