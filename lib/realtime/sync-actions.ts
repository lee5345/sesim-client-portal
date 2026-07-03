"use server";

import { requireAuth } from "@/lib/auth/guards";
import { isFirmRole } from "@/lib/permissions/crud";
import {
  acknowledgeTenantChanges,
  getEarliestUnreadDailyWorkerPeriod,
  getNotificationCounts,
  listUnreadTenantChangeEntityIds,
  type NotificationCounts,
  type YearMonthPeriod,
} from "@/modules/notifications/tenant-changes";
import type { TenantChangeEntityType } from "@/lib/generated/prisma/client";
import {
  FIRM_SYNC_SCOPE,
  companySyncScope,
  getSyncRevision,
} from "@/modules/realtime/sync";

export type RealtimeSyncState = {
  revision: string;
  notifications: NotificationCounts;
};

export async function getRealtimeSyncStateAction(): Promise<RealtimeSyncState> {
  const session = await requireAuth([
    "CLIENT_ADMIN",
    "FIRM_STAFF",
    "FIRM_ADMIN",
  ]);

  const scopes = [FIRM_SYNC_SCOPE];
  if (session.user.companyId) {
    scopes.push(companySyncScope(session.user.companyId));
  }

  const [revision, notifications] = await Promise.all([
    getSyncRevision(scopes),
    getNotificationCounts({
      userId: session.user.userId,
      role: session.user.role,
      companyId: session.user.companyId,
    }),
  ]);

  const registrationSuffix = isFirmRole(session.user.role)
    ? `:reg:${notifications.registrationRequests}`
    : "";

  return {
    revision: `${revision}${registrationSuffix}`,
    notifications,
  };
}

export async function acknowledgeTenantChangesAction(input: {
  companyId: string;
  entityTypes: TenantChangeEntityType[];
  periodYear?: number;
  periodMonth?: number;
}): Promise<void> {
  const session = await requireAuth([
    "CLIENT_ADMIN",
    "FIRM_STAFF",
    "FIRM_ADMIN",
  ]);

  await acknowledgeTenantChanges({
    userId: session.user.userId,
    companyId: input.companyId,
    entityTypes: input.entityTypes,
    periodYear: input.periodYear,
    periodMonth: input.periodMonth,
  });
}

export async function listUnreadTenantChangeEntityIdsAction(input: {
  companyId: string;
  entityTypes: TenantChangeEntityType[];
  periodYear?: number;
  periodMonth?: number;
}): Promise<string[]> {
  const session = await requireAuth([
    "CLIENT_ADMIN",
    "FIRM_STAFF",
    "FIRM_ADMIN",
  ]);

  return listUnreadTenantChangeEntityIds({
    userId: session.user.userId,
    role: session.user.role,
    companyId: input.companyId,
    entityTypes: input.entityTypes,
    periodYear: input.periodYear,
    periodMonth: input.periodMonth,
  });
}

export async function getEarliestUnreadDailyWorkerPeriodAction(input: {
  companyId: string;
}): Promise<YearMonthPeriod | null> {
  const session = await requireAuth([
    "CLIENT_ADMIN",
    "FIRM_STAFF",
    "FIRM_ADMIN",
  ]);

  return getEarliestUnreadDailyWorkerPeriod({
    userId: session.user.userId,
    role: session.user.role,
    companyId: input.companyId,
  });
}
