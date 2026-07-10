import { prisma } from "@/lib/db/db";
import { bumpCompanyLastModifiedAt } from "@/modules/companies/last-modified";

export const FIRM_SYNC_SCOPE = "firm";

export function companySyncScope(companyId: string): string {
  return `company:${companyId}`;
}

export async function bumpSyncCursors(companyId: string): Promise<void> {
  const companyScope = companySyncScope(companyId);
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await bumpCompanyLastModifiedAt(companyId, now, tx);
    await tx.portalSyncCursor.upsert({
      where: { scope: FIRM_SYNC_SCOPE },
      create: { scope: FIRM_SYNC_SCOPE, version: 1n, updatedAt: now },
      update: { version: { increment: 1 }, updatedAt: now },
    });
    await tx.portalSyncCursor.upsert({
      where: { scope: companyScope },
      create: { scope: companyScope, version: 1n, updatedAt: now },
      update: { version: { increment: 1 }, updatedAt: now },
    });
  });
}

export async function getSyncRevision(scopes: string[]): Promise<string> {
  const uniqueScopes = [...new Set(scopes)];

  const cursors = await prisma.portalSyncCursor.findMany({
    where: { scope: { in: uniqueScopes } },
    select: { scope: true, version: true, updatedAt: true },
  });

  const cursorMap = new Map(
    cursors.map((cursor) => [cursor.scope, cursor]),
  );

  return uniqueScopes
    .map((scope) => {
      const cursor = cursorMap.get(scope);
      if (!cursor) {
        return `${scope}:0`;
      }
      return `${scope}:${cursor.version.toString()}:${cursor.updatedAt.getTime()}`;
    })
    .join("|");
}
