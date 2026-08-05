"use server";

import { z } from "zod";

import { requireAuth } from "@/lib/auth/guards";
import { CRUD_PAGE_SIZE } from "@/lib/constants/pagination";
import { prisma } from "@/lib/db/db";
import {
  EMPTY_AUDIT_LOG_FILTERS,
  parseAuditFilterDate,
  type AuditLogFilterValues,
} from "@/lib/filters/audit-logs";
import type { PaginationResult } from "@/lib/pagination";
import { compareKorean, sortFirmStaffUsers } from "@/lib/sort/korean";
import type { AuditAction, Prisma, UserRole } from "@/lib/generated/prisma/client";
import {
  AUDIT_ACTION_OPTIONS,
  AUDIT_TABLE_NAME_OPTIONS,
} from "@/modules/audit-logs/labels";

const companyIdSchema = z.string().uuid();

const listFiltersSchema = z.object({
  actorIds: z.array(z.string().uuid()),
  actions: z.array(z.enum(AUDIT_ACTION_OPTIONS)),
  tableNames: z.array(z.enum(AUDIT_TABLE_NAME_OPTIONS)),
  createdAtFrom: z.string(),
  createdAtTo: z.string(),
});

export type AuditLogActorOption = {
  id: string;
  name: string;
  role: UserRole;
  isActive: boolean;
};

export type AuditLogListItem = {
  id: string;
  action: AuditAction;
  tableName: string;
  recordId: string | null;
  payload: Prisma.JsonValue | null;
  createdAt: Date;
  actor: {
    id: string;
    name: string;
    role: UserRole;
  };
};

export type AuditLogListResult = PaginationResult<AuditLogListItem>;

export async function listAuditLogActors(
  companyId: string,
): Promise<AuditLogActorOption[]> {
  await requireAuth(["FIRM_STAFF", "FIRM_ADMIN"]);

  const parsedCompanyId = companyIdSchema.safeParse(companyId);
  if (!parsedCompanyId.success) {
    return [];
  }

  const company = await prisma.company.findFirst({
    where: { id: parsedCompanyId.data, deletedAt: null },
    select: { id: true },
  });
  if (!company) {
    return [];
  }

  const [clientUsers, firmUsers] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: "CLIENT_ADMIN",
        companyId: parsedCompanyId.data,
      },
      select: {
        id: true,
        name: true,
        role: true,
        isActive: true,
      },
    }),
    prisma.user.findMany({
      where: { role: { in: ["FIRM_STAFF", "FIRM_ADMIN"] } },
      select: {
        id: true,
        name: true,
        role: true,
        isActive: true,
      },
    }),
  ]);

  const sortedClients = [...clientUsers].sort((a, b) => {
    if (a.isActive !== b.isActive) {
      return a.isActive ? -1 : 1;
    }
    return compareKorean(a.name, b.name);
  });

  return [...sortedClients, ...sortFirmStaffUsers(firmUsers)];
}

function buildAuditLogWhere(
  companyId: string,
  filters: AuditLogFilterValues,
): Prisma.AuditLogWhereInput {
  const createdAtFrom = parseAuditFilterDate(filters.createdAtFrom);
  const createdAtTo = parseAuditFilterDate(filters.createdAtTo, true);

  const createdAt: Prisma.DateTimeFilter | undefined =
    createdAtFrom || createdAtTo
      ? {
          ...(createdAtFrom ? { gte: createdAtFrom } : {}),
          ...(createdAtTo ? { lte: createdAtTo } : {}),
        }
      : undefined;

  return {
    companyId,
    ...(filters.actorIds.length > 0 ? { actorId: { in: filters.actorIds } } : {}),
    ...(filters.actions.length > 0
      ? { action: { in: filters.actions as AuditAction[] } }
      : {}),
    ...(filters.tableNames.length > 0
      ? { tableName: { in: filters.tableNames } }
      : {}),
    ...(createdAt ? { createdAt } : {}),
  };
}

export async function listAuditLogs(
  companyId: string,
  filters: AuditLogFilterValues = EMPTY_AUDIT_LOG_FILTERS,
  page = 1,
): Promise<AuditLogListResult> {
  await requireAuth(["FIRM_STAFF", "FIRM_ADMIN"]);

  const parsedCompanyId = companyIdSchema.safeParse(companyId);
  if (!parsedCompanyId.success) {
    return emptyPage(page);
  }

  const company = await prisma.company.findFirst({
    where: { id: parsedCompanyId.data, deletedAt: null },
    select: { id: true },
  });
  if (!company) {
    return emptyPage(page);
  }

  const parsedFilters = listFiltersSchema.safeParse(filters);
  const safeFilters = parsedFilters.success
    ? parsedFilters.data
    : EMPTY_AUDIT_LOG_FILTERS;

  const where = buildAuditLogWhere(parsedCompanyId.data, safeFilters);
  const pageSize = CRUD_PAGE_SIZE;
  const safePage = Math.max(1, page);

  const total = await prisma.auditLog.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const currentPage = Math.min(safePage, totalPages);
  const skip = (currentPage - 1) * pageSize;

  const rows = await prisma.auditLog.findMany({
    where,
    select: {
      id: true,
      action: true,
      tableName: true,
      recordId: true,
      payload: true,
      createdAt: true,
      actor: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: pageSize,
  });

  return {
    items: rows,
    page: currentPage,
    pageSize,
    total,
    totalPages,
    rangeStart: total === 0 ? 0 : skip + 1,
    rangeEnd: Math.min(skip + pageSize, total),
  };
}

function emptyPage(page: number): AuditLogListResult {
  return {
    items: [],
    page: Math.max(1, page),
    pageSize: CRUD_PAGE_SIZE,
    total: 0,
    totalPages: 1,
    rangeStart: 0,
    rangeEnd: 0,
  };
}
