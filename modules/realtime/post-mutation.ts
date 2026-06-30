import type { AuditAction, TenantChangeEntityType } from "@/lib/generated/prisma/client";
import type { DataEditSession } from "@/lib/permissions/crud";
import { recordCrossTenantChange } from "@/modules/notifications/tenant-changes";
import { bumpSyncCursors } from "@/modules/realtime/sync";

export async function afterDataMutation(input: {
  session: DataEditSession;
  companyId: string;
  entityType: TenantChangeEntityType;
  entityId?: string;
  action: AuditAction;
}): Promise<void> {
  await bumpSyncCursors(input.companyId);

  await recordCrossTenantChange({
    companyId: input.companyId,
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    actorId: input.session.user.userId,
    actorRole: input.session.user.role,
  });
}

export async function afterFirmScopeMutation(companyId?: string): Promise<void> {
  if (companyId) {
    await bumpSyncCursors(companyId);
    return;
  }

  const { prisma } = await import("@/lib/db/db");
  const now = new Date();
  await prisma.portalSyncCursor.upsert({
    where: { scope: "firm" },
    create: { scope: "firm", version: 1n, updatedAt: now },
    update: { version: { increment: 1 }, updatedAt: now },
  });
}
