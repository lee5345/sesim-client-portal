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

export type YearMonthPeriod = {
  year: number;
  month: number;
};

const CLIENT_NAV_ENTITY_MAP: Record<string, TenantChangeEntityType[]> = {
  "/client/new-hires": ["NEW_HIRE"],
  "/client/terminations": ["TERMINATION"],
  "/client/daily-workers": ["DAILY_WORKER"],
  "/client/compensation-changes": ["COMPENSATION_CHANGE"],
  "/client/compensation-info": ["COMPENSATION_INFO"],
  "/client/business-income": ["BUSINESS_INCOME"],
};

const FIRM_TAB_ENTITY_MAP: Record<string, TenantChangeEntityType> = {
  "new-hires": "NEW_HIRE",
  terminations: "TERMINATION",
  "daily-workers": "DAILY_WORKER",
  "compensation-changes": "COMPENSATION_CHANGE",
  "compensation-info": "COMPENSATION_INFO",
  "business-income": "BUSINESS_INCOME",
};

const PERIOD_SCOPED_ENTITY_TYPES = [
  "DAILY_WORKER",
  "COMPENSATION_INFO",
  "BUSINESS_INCOME",
] as const;
type PeriodScopedEntityType = (typeof PERIOD_SCOPED_ENTITY_TYPES)[number];

const NOTIFICATION_ENTITY_TYPES = [
  "NEW_HIRE",
  "TERMINATION",
  "DAILY_WORKER",
  "COMPENSATION_CHANGE",
  "COMPENSATION_INFO",
  "BUSINESS_INCOME",
] as const;
type NotificationEntityType = (typeof NOTIFICATION_ENTITY_TYPES)[number];

const NOTIFICATION_ACTIONS = ["CREATE", "UPDATE"] as const;

type PeriodKey = `${number}-${number}`;

function periodKey(year: number, month: number): PeriodKey {
  return `${year}-${month}`;
}

function comparePeriods(a: YearMonthPeriod, b: YearMonthPeriod): number {
  if (a.year !== b.year) {
    return a.year - b.year;
  }
  return a.month - b.month;
}

function audienceForRole(role: UserRole): TenantChangeAudience {
  return isFirmRole(role) ? "FIRM" : "CLIENT";
}

function isPeriodScopedEntityType(
  entityType: TenantChangeEntityType,
): entityType is PeriodScopedEntityType {
  return (PERIOD_SCOPED_ENTITY_TYPES as readonly string[]).includes(entityType);
}

async function getDailyWorkerPeriodsByEntityId(
  companyId: string,
  entityIds: string[],
): Promise<Map<string, YearMonthPeriod>> {
  if (entityIds.length === 0) {
    return new Map();
  }

  const workers = await prisma.dailyWorker.findMany({
    where: {
      companyId,
      id: { in: entityIds },
    },
    select: {
      id: true,
      year: true,
      month: true,
    },
  });

  return new Map(
    workers.map((worker) => [
      worker.id,
      { year: worker.year, month: worker.month },
    ]),
  );
}

async function getCompensationInfoPeriodsByEntityId(
  companyId: string,
  entityIds: string[],
): Promise<Map<string, YearMonthPeriod>> {
  if (entityIds.length === 0) {
    return new Map();
  }

  const records = await prisma.compensationInfo.findMany({
    where: {
      companyId,
      id: { in: entityIds },
    },
    select: {
      id: true,
      year: true,
      month: true,
    },
  });

  return new Map(
    records.map((record) => [
      record.id,
      { year: record.year, month: record.month },
    ]),
  );
}

async function getBusinessIncomePeriodsByEntityId(
  companyId: string,
  entityIds: string[],
): Promise<Map<string, YearMonthPeriod>> {
  if (entityIds.length === 0) {
    return new Map();
  }

  const records = await prisma.businessIncome.findMany({
    where: {
      companyId,
      id: { in: entityIds },
    },
    select: {
      id: true,
      year: true,
      month: true,
    },
  });

  return new Map(
    records.map((record) => [
      record.id,
      { year: record.year, month: record.month },
    ]),
  );
}

async function getEntityPeriodsByEntityId(
  entityType: PeriodScopedEntityType,
  companyId: string,
  entityIds: string[],
): Promise<Map<string, YearMonthPeriod>> {
  if (entityType === "DAILY_WORKER") {
    return getDailyWorkerPeriodsByEntityId(companyId, entityIds);
  }

  if (entityType === "COMPENSATION_INFO") {
    return getCompensationInfoPeriodsByEntityId(companyId, entityIds);
  }

  return getBusinessIncomePeriodsByEntityId(companyId, entityIds);
}

async function getPeriodReadCursors(
  userId: string,
  companyIds: string[],
  entityType: TenantChangeEntityType,
): Promise<Map<string, Map<PeriodKey, Date>>> {
  if (companyIds.length === 0) {
    return new Map();
  }

  const cursors = await prisma.tenantChangePeriodReadCursor.findMany({
    where: {
      userId,
      companyId: { in: companyIds },
      entityType,
    },
    select: {
      companyId: true,
      periodYear: true,
      periodMonth: true,
      lastReadAt: true,
    },
  });

  const result = new Map<string, Map<PeriodKey, Date>>();

  for (const cursor of cursors) {
    const byPeriod =
      result.get(cursor.companyId) ?? new Map<PeriodKey, Date>();
    byPeriod.set(
      periodKey(cursor.periodYear, cursor.periodMonth),
      cursor.lastReadAt,
    );
    result.set(cursor.companyId, byPeriod);
  }

  return result;
}

function getEffectiveLastReadAt(input: {
  globalLastReadAt?: Date;
  periodLastReadAt?: Date;
}): Date | undefined {
  if (input.periodLastReadAt && input.globalLastReadAt) {
    return input.periodLastReadAt > input.globalLastReadAt
      ? input.periodLastReadAt
      : input.globalLastReadAt;
  }

  return input.periodLastReadAt ?? input.globalLastReadAt;
}

function isUnreadChange(
  createdAt: Date,
  lastReadAt: Date | undefined,
): boolean {
  return !lastReadAt || createdAt > lastReadAt;
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
  periodYear?: number;
  periodMonth?: number;
}): Promise<void> {
  const now = new Date();
  const hasPeriod =
    input.periodYear !== undefined && input.periodMonth !== undefined;

  const globalEntityTypes = hasPeriod
    ? input.entityTypes.filter((entityType) => !isPeriodScopedEntityType(entityType))
    : input.entityTypes;

  const operations = globalEntityTypes.map((entityType) =>
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
  );

  if (
    hasPeriod &&
    input.periodYear !== undefined &&
    input.periodMonth !== undefined
  ) {
    for (const entityType of input.entityTypes.filter(isPeriodScopedEntityType)) {
      operations.push(
        prisma.tenantChangePeriodReadCursor.upsert({
          where: {
            userId_companyId_entityType_periodYear_periodMonth: {
              userId: input.userId,
              companyId: input.companyId,
              entityType,
              periodYear: input.periodYear,
              periodMonth: input.periodMonth,
            },
          },
          create: {
            userId: input.userId,
            companyId: input.companyId,
            entityType,
            periodYear: input.periodYear,
            periodMonth: input.periodMonth,
            lastReadAt: now,
          },
          update: { lastReadAt: now },
        }),
      );
    }
  }

  if (operations.length > 0) {
    await prisma.$transaction(operations);
  }
}

async function getUnreadByCompany(
  userId: string,
  audience: TenantChangeAudience,
  entityTypes: NotificationEntityType[],
  companyIds?: string[],
): Promise<Record<string, Partial<Record<TenantChangeEntityType, number>>>> {
  const changes = await prisma.tenantChange.findMany({
    where: {
      audience,
      action: { in: [...NOTIFICATION_ACTIONS] },
      entityType: { in: entityTypes },
      ...(companyIds ? { companyId: { in: companyIds } } : {}),
    },
    select: {
      companyId: true,
      entityType: true,
      entityId: true,
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

  const periodScopedEntityTypes = entityTypes.filter(isPeriodScopedEntityType);
  const periodsByCompanyAndType = new Map<
    PeriodScopedEntityType,
    Map<string, Map<string, YearMonthPeriod>>
  >();
  const periodCursorsByCompanyAndType = new Map<
    PeriodScopedEntityType,
    Map<string, Map<PeriodKey, Date>>
  >();

  for (const entityType of periodScopedEntityTypes) {
    periodCursorsByCompanyAndType.set(
      entityType,
      await getPeriodReadCursors(userId, scopedCompanyIds, entityType),
    );
    periodsByCompanyAndType.set(entityType, new Map());
  }

  for (const companyId of scopedCompanyIds) {
    for (const entityType of periodScopedEntityTypes) {
      const companyEntityIds = changes
        .filter(
          (change) =>
            change.companyId === companyId &&
            change.entityType === entityType &&
            change.entityId,
        )
        .map((change) => change.entityId as string);

      if (companyEntityIds.length > 0) {
        periodsByCompanyAndType
          .get(entityType)
          ?.set(
            companyId,
            await getEntityPeriodsByEntityId(entityType, companyId, companyEntityIds),
          );
      }
    }
  }

  const unreadEntityIdsByCompanyType = new Map<
    string,
    Map<TenantChangeEntityType, Set<string>>
  >();

  for (const change of changes) {
    if (!change.entityId) {
      continue;
    }

    let lastReadAt = cursorMap.get(`${change.companyId}:${change.entityType}`);

    if (isPeriodScopedEntityType(change.entityType)) {
      const period = periodsByCompanyAndType
        .get(change.entityType)
        ?.get(change.companyId)
        ?.get(change.entityId);

      if (!period) {
        continue;
      }

      const periodLastReadAt = periodCursorsByCompanyAndType
        .get(change.entityType)
        ?.get(change.companyId)
        ?.get(periodKey(period.year, period.month));

      lastReadAt = getEffectiveLastReadAt({
        globalLastReadAt: lastReadAt,
        periodLastReadAt,
      });
    }

    if (!isUnreadChange(change.createdAt, lastReadAt)) {
      continue;
    }

    const byType =
      unreadEntityIdsByCompanyType.get(change.companyId) ??
      new Map<TenantChangeEntityType, Set<string>>();
    const ids = byType.get(change.entityType) ?? new Set<string>();
    ids.add(change.entityId);
    byType.set(change.entityType, ids);
    unreadEntityIdsByCompanyType.set(change.companyId, byType);
  }

  const result: Record<string, Partial<Record<TenantChangeEntityType, number>>> =
    {};

  for (const [companyId, byType] of unreadEntityIdsByCompanyType.entries()) {
    const companyCounts: Partial<Record<TenantChangeEntityType, number>> = {};
    for (const [entityType, ids] of byType.entries()) {
      companyCounts[entityType] = ids.size;
    }
    result[companyId] = companyCounts;
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
  periodYear?: number;
  periodMonth?: number;
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
      action: { in: [...NOTIFICATION_ACTIONS] },
      entityType: { in: input.entityTypes },
    },
    select: { entityType: true, entityId: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const periodScopedEntityTypes = input.entityTypes.filter(isPeriodScopedEntityType);
  const periodsByEntityType = new Map<
    PeriodScopedEntityType,
    Map<string, YearMonthPeriod>
  >();
  const periodCursorsByEntityType = new Map<
    PeriodScopedEntityType,
    Map<PeriodKey, Date>
  >();

  for (const entityType of periodScopedEntityTypes) {
    const entityIds = [
      ...new Set(
        changes
          .filter((change) => change.entityType === entityType && change.entityId)
          .map((change) => change.entityId as string),
      ),
    ];

    periodsByEntityType.set(
      entityType,
      await getEntityPeriodsByEntityId(entityType, input.companyId, entityIds),
    );
    periodCursorsByEntityType.set(
      entityType,
      (await getPeriodReadCursors(input.userId, [input.companyId], entityType)).get(
        input.companyId,
      ) ?? new Map<PeriodKey, Date>(),
    );
  }

  const ids = new Set<string>();

  for (const change of changes) {
    if (!change.entityId) {
      continue;
    }

    let lastReadAt = cursorMap.get(change.entityType);

    if (isPeriodScopedEntityType(change.entityType)) {
      const period = periodsByEntityType.get(change.entityType)?.get(change.entityId);
      if (!period) {
        continue;
      }

      if (
        input.periodYear !== undefined &&
        input.periodMonth !== undefined &&
        (period.year !== input.periodYear || period.month !== input.periodMonth)
      ) {
        continue;
      }

      const periodLastReadAt = periodCursorsByEntityType
        .get(change.entityType)
        ?.get(periodKey(period.year, period.month));

      lastReadAt = getEffectiveLastReadAt({
        globalLastReadAt: lastReadAt,
        periodLastReadAt,
      });
    }

    if (!isUnreadChange(change.createdAt, lastReadAt)) {
      continue;
    }

    ids.add(change.entityId);
  }

  return [...ids];
}

export async function getEarliestUnreadPeriodScopedPeriod(input: {
  userId: string;
  role: UserRole;
  companyId: string;
  entityType: PeriodScopedEntityType;
}): Promise<YearMonthPeriod | null> {
  const unreadIds = await listUnreadTenantChangeEntityIds({
    userId: input.userId,
    role: input.role,
    companyId: input.companyId,
    entityTypes: [input.entityType],
  });

  if (unreadIds.length === 0) {
    return null;
  }

  const periods = await getEntityPeriodsByEntityId(
    input.entityType,
    input.companyId,
    unreadIds,
  );
  const uniquePeriods = [
    ...new Map(
      [...periods.values()].map((period) => [
        periodKey(period.year, period.month),
        period,
      ]),
    ).values(),
  ];

  uniquePeriods.sort(comparePeriods);
  return uniquePeriods[0] ?? null;
}

export async function getEarliestUnreadDailyWorkerPeriod(input: {
  userId: string;
  role: UserRole;
  companyId: string;
}): Promise<YearMonthPeriod | null> {
  return getEarliestUnreadPeriodScopedPeriod({
    ...input,
    entityType: "DAILY_WORKER",
  });
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
    [...NOTIFICATION_ENTITY_TYPES],
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
