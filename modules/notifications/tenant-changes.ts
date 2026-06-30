import type {
  AuditAction,
  TenantChangeAudience,
  TenantChangeEntityType,
  UserRole,
} from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db/db";
import { isFirmRole } from "@/lib/permissions/crud";

export type NotificationCounts = {
  registrationRequests: number;
  navBadges: Record<string, number>;
  companyBadges: Record<string, number>;
  companyModuleBadges: Record<string, Partial<Record<TenantChangeEntityType, number>>>;
};

const CLIENT_NAV_ENTITY_MAP: Record<string, TenantChangeEntityType[]> = {
  "/client/new-hires": ["NEW_HIRE"],
  "/client/terminations": ["TERMINATION"],
  "/client/daily-workers": ["DAILY_WORKER"],
};

const FIRM_TAB_ENTITY_MAP: Record<string, TenantChangeEntityType> = {
  "new-hires": "NEW_HIRE",
  terminations: "TERMINATION",
  "daily-workers": "DAILY_WORKER",
};

function audienceForRole(role: UserRole): TenantChangeAudience {
  return isFirmRole(role) ? "FIRM" : "CLIENT";
}

export async function recordCrossTenantChange(input: {
  companyId: string;
  entityType: TenantChangeEntityType;
  entityId?: string;
  action: AuditAction;
  actorId: string;
  actorRole: UserRole;
}): Promise<void> {
  const audience: TenantChangeAudience = isFirmRole(input.actorRole)
    ? "CLIENT"
    : "FIRM";

  await prisma.tenantChange.create({
    data: {
      companyId: input.companyId,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      action: input.action,
      audience,
      actorId: input.actorId,
    },
  });
}

export async function acknowledgeTenantChanges(input: {
  userId: string;
  companyId: string;
  entityTypes: TenantChangeEntityType[];
}): Promise<void> {
  const now = new Date();

  await prisma.$transaction(
    input.entityTypes.map((entityType) =>
      prisma.tenantChangeReadCursor.upsert({
        where: {
          userId_companyId_entityType: {
            userId: input.userId,
            companyId: input.companyId,
            entityType,
          },
        },
        create: {
          userId: input.userId,
          companyId: input.companyId,
          entityType,
          lastReadAt: now,
        },
        update: { lastReadAt: now },
      }),
    ),
  );
}

async function getUnreadByCompany(
  userId: string,
  audience: TenantChangeAudience,
  companyIds?: string[],
): Promise<Record<string, Partial<Record<TenantChangeEntityType, number>>>> {
  const changes = await prisma.tenantChange.findMany({
    where: {
      audience,
      ...(companyIds ? { companyId: { in: companyIds } } : {}),
    },
    select: {
      companyId: true,
      entityType: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  if (changes.length === 0) {
    return {};
  }

  const scopedCompanyIds = companyIds ?? [...new Set(changes.map((c) => c.companyId))];

  const cursors = await prisma.tenantChangeReadCursor.findMany({
    where: {
      userId,
      companyId: { in: scopedCompanyIds },
    },
    select: {
      companyId: true,
      entityType: true,
      lastReadAt: true,
    },
  });

  const cursorMap = new Map(
    cursors.map((cursor) => [
      `${cursor.companyId}:${cursor.entityType}`,
      cursor.lastReadAt,
    ]),
  );

  const result: Record<string, Partial<Record<TenantChangeEntityType, number>>> =
    {};

  for (const change of changes) {
    const cursorKey = `${change.companyId}:${change.entityType}`;
    const lastReadAt = cursorMap.get(cursorKey);
    if (lastReadAt && change.createdAt <= lastReadAt) {
      continue;
    }

    const companyCounts = result[change.companyId] ?? {};
    companyCounts[change.entityType] = (companyCounts[change.entityType] ?? 0) + 1;
    result[change.companyId] = companyCounts;
  }

  return result;
}

function sumCompanyCounts(
  companyCounts: Partial<Record<TenantChangeEntityType, number>>,
  entityTypes?: TenantChangeEntityType[],
): number {
  if (!entityTypes) {
    return Object.values(companyCounts).reduce((sum, count) => sum + (count ?? 0), 0);
  }

  return entityTypes.reduce(
    (sum, entityType) => sum + (companyCounts[entityType] ?? 0),
    0,
  );
}

export async function listUnreadTenantChangeEntityIds(input: {
  userId: string;
  role: UserRole;
  companyId: string;
  entityTypes: TenantChangeEntityType[];
}): Promise<string[]> {
  const audience = audienceForRole(input.role);

  const cursors = await prisma.tenantChangeReadCursor.findMany({
    where: {
      userId: input.userId,
      companyId: input.companyId,
      entityType: { in: input.entityTypes },
    },
    select: { entityType: true, lastReadAt: true },
  });

  const cursorMap = new Map(
    cursors.map((cursor) => [cursor.entityType, cursor.lastReadAt]),
  );

  const changes = await prisma.tenantChange.findMany({
    where: {
      audience,
      companyId: input.companyId,
      entityType: { in: input.entityTypes },
    },
    select: { entityType: true, entityId: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const ids = new Set<string>();

  for (const change of changes) {
    if (!change.entityId) {
      continue;
    }
    const lastReadAt = cursorMap.get(change.entityType);
    if (lastReadAt && change.createdAt <= lastReadAt) {
      continue;
    }
    ids.add(change.entityId);
  }

  return [...ids];
}

export async function getNotificationCounts(input: {
  userId: string;
  role: UserRole;
  companyId?: string | null;
}): Promise<NotificationCounts> {
  const audience = audienceForRole(input.role);
  const registrationRequests = isFirmRole(input.role)
    ? await prisma.registrationRequest.count({ where: { status: "PENDING" } })
    : 0;

  const companyIds = input.companyId ? [input.companyId] : undefined;
  const unreadByCompany = await getUnreadByCompany(
    input.userId,
    audience,
    companyIds,
  );

  const companyModuleBadges = unreadByCompany;
  const companyBadges: Record<string, number> = {};
  for (const [companyId, counts] of Object.entries(unreadByCompany)) {
    companyBadges[companyId] = sumCompanyCounts(counts);
  }

  const navBadges: Record<string, number> = {};

  if (isFirmRole(input.role)) {
    const totalCompanyUnread = Object.values(companyBadges).reduce(
      (sum, count) => sum + count,
      0,
    );
    if (totalCompanyUnread > 0) {
      navBadges["/firm/companies"] = totalCompanyUnread;
    }
    if (registrationRequests > 0) {
      navBadges["/firm/client-accounts"] = registrationRequests;
    }
  } else if (input.companyId) {
    const counts = unreadByCompany[input.companyId] ?? {};
    for (const [href, entityTypes] of Object.entries(CLIENT_NAV_ENTITY_MAP)) {
      const count = sumCompanyCounts(counts, entityTypes);
      if (count > 0) {
        navBadges[href] = count;
      }
    }
  }

  return {
    registrationRequests,
    navBadges,
    companyBadges,
    companyModuleBadges,
  };
}

export function getFirmTabUnreadCount(
  counts: NotificationCounts,
  companyId: string,
  tab: string,
): number {
  const entityType = FIRM_TAB_ENTITY_MAP[tab];
  if (!entityType) {
    return 0;
  }
  return counts.companyModuleBadges[companyId]?.[entityType] ?? 0;
}

export {
  CLIENT_NAV_ENTITY_MAP,
  FIRM_TAB_ENTITY_MAP,
  audienceForRole,
};
