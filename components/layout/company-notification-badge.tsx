"use client";

import { NotificationCountBadge } from "@/components/layout/notification-count-badge";
import { useRealtimeSync } from "@/components/layout/realtime-sync-provider";
import type { TenantChangeEntityType } from "@/lib/generated/prisma/client";

type CompanyNotificationBadgeProps = {
  companyId: string;
  entityType?: TenantChangeEntityType;
};

export function CompanyNotificationBadge({
  companyId,
  entityType,
}: CompanyNotificationBadgeProps) {
  const { getCompanyBadge, getCompanyModuleBadge } = useRealtimeSync();
  const count = entityType
    ? getCompanyModuleBadge(companyId, entityType)
    : getCompanyBadge(companyId);

  return <NotificationCountBadge count={count} variant="change" />;
}
