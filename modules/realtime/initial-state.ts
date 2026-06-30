import { isFirmRole } from "@/lib/permissions/crud";
import { getNotificationCounts } from "@/modules/notifications/tenant-changes";
import {
  FIRM_SYNC_SCOPE,
  companySyncScope,
  getSyncRevision,
} from "@/modules/realtime/sync";
import type { RealtimeSyncState } from "@/lib/realtime/sync-actions";
import type { UserRole } from "@/lib/generated/prisma/client";

export async function getInitialRealtimeSyncState(input: {
  userId: string;
  role: UserRole;
  companyId?: string | null;
}): Promise<RealtimeSyncState> {
  const scopes = [FIRM_SYNC_SCOPE];
  if (input.companyId) {
    scopes.push(companySyncScope(input.companyId));
  }

  const [revision, notifications] = await Promise.all([
    getSyncRevision(scopes),
    getNotificationCounts({
      userId: input.userId,
      role: input.role,
      companyId: input.companyId,
    }),
  ]);

  const registrationSuffix = isFirmRole(input.role)
    ? `:reg:${notifications.registrationRequests}`
    : "";

  return {
    revision: `${revision}${registrationSuffix}`,
    notifications,
  };
}
