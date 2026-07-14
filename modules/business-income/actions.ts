"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/db/db";
import { decryptRRN, encryptRRN, maskRRN } from "@/lib/encryption/rrn";
import {
  decryptRrnsForIds,
  rrnRecordIdsSchema,
} from "@/lib/encryption/reveal-rrns-bulk";
import type { Prisma } from "@/lib/generated/prisma/client";
import {
  parseOptionalCompanyId,
  requireDataEditAuth,
  resolveCompanyId,
} from "@/lib/permissions/crud";
import {
  normalizeRRN,
  parseCreateBusinessIncomeFormData,
  parseUpdateBusinessIncomeFormData,
  toBusinessIncomeAuditPayload,
  type BusinessIncomeCoreInput,
} from "@/lib/validation/business-income";
import { afterDataMutation } from "@/modules/realtime/post-mutation";

const CLIENT_BUSINESS_INCOME_PATH = "/client/business-income";

export type BusinessIncomeActionResult =
  | { success: true }
  | { success: false; error: string };

const idSchema = z.object({
  id: z.string().uuid(),
});

const periodSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

function revalidateBusinessIncomePaths(companyId: string) {
  revalidatePath(`/firm/companies/${companyId}`);
  revalidatePath(CLIENT_BUSINESS_INCOME_PATH);
  revalidatePath("/firm/companies");
  revalidatePath("/firm", "layout");
  revalidatePath("/client", "layout");
}

function toBusinessIncomeData(input: BusinessIncomeCoreInput) {
  return {
    year: input.year,
    month: input.month,
    name: input.name,
    incomeAmount: input.incomeAmount,
    incomeBasis: input.incomeBasis,
    notes: input.notes ?? null,
  };
}

async function getOwnedBusinessIncome(id: string, companyId: string) {
  const record = await prisma.businessIncome.findFirst({
    where: { id, companyId, deletedAt: null },
  });

  if (!record) {
    throw new Error("사업소득 정보를 찾을 수 없습니다.");
  }

  return record;
}

const businessIncomeSelect = {
  id: true,
  year: true,
  month: true,
  name: true,
  rrnEncrypted: true,
  rrnIv: true,
  incomeAmount: true,
  incomeBasis: true,
  notes: true,
  createdAt: true,
  createdBy: {
    select: { name: true },
  },
} as const satisfies Prisma.BusinessIncomeSelect;

type BusinessIncomeDbRecord = Prisma.BusinessIncomeGetPayload<{
  select: typeof businessIncomeSelect;
}>;

function mapBusinessIncomeRecord(record: BusinessIncomeDbRecord) {
  const plaintext = decryptRRN(record.rrnEncrypted, record.rrnIv);
  const {
    rrnEncrypted: _encrypted,
    rrnIv: _iv,
    createdBy,
    ...rest
  } = record;

  return {
    ...rest,
    createdByName: createdBy.name,
    maskedRrn: maskRRN(plaintext),
  };
}

export async function listBusinessIncomes(
  companyId: string,
  year: number,
  month: number,
) {
  const session = await requireDataEditAuth();
  resolveCompanyId(session, companyId);
  const period = periodSchema.parse({ year, month });

  const records = await prisma.businessIncome.findMany({
    where: {
      companyId,
      year: period.year,
      month: period.month,
      deletedAt: null,
    },
    orderBy: [{ name: "asc" }, { createdAt: "asc" }],
    select: businessIncomeSelect,
  });

  return records.map(mapBusinessIncomeRecord);
}

export async function createBusinessIncome(input: {
  year: number;
  month: number;
  formData: FormData;
}): Promise<BusinessIncomeActionResult> {
  const session = await requireDataEditAuth();
  const companyId = resolveCompanyId(
    session,
    parseOptionalCompanyId(input.formData),
  );
  const parsed = parseCreateBusinessIncomeFormData({
    formData: input.formData,
    year: input.year,
    month: input.month,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }

  const data = parsed.data;
  const { encrypted, iv } = encryptRRN(normalizeRRN(data.rrn));

  let createdId: string | undefined;

  await prisma.$transaction(async (tx) => {
    const record = await tx.businessIncome.create({
      data: {
        ...toBusinessIncomeData(data),
        rrnEncrypted: encrypted,
        rrnIv: iv,
        company: { connect: { id: companyId } },
        createdBy: { connect: { id: session.user.userId } },
      },
    });
    createdId = record.id;

    await tx.auditLog.create({
      data: {
        actorId: session.user.userId,
        companyId,
        action: "CREATE",
        tableName: "business_incomes",
        recordId: record.id,
        payload: toBusinessIncomeAuditPayload(data),
      },
    });
  });

  await afterDataMutation({
    session,
    companyId,
    entityType: "BUSINESS_INCOME",
    entityId: createdId,
    action: "CREATE",
  });

  revalidateBusinessIncomePaths(companyId);
  return { success: true };
}

export async function updateBusinessIncome(
  id: string,
  input: {
    year: number;
    month: number;
    formData: FormData;
  },
): Promise<BusinessIncomeActionResult> {
  const session = await requireDataEditAuth();
  const companyId = resolveCompanyId(
    session,
    parseOptionalCompanyId(input.formData),
  );
  const { id: parsedId } = idSchema.parse({ id });
  const existing = await getOwnedBusinessIncome(parsedId, companyId);
  const parsed = parseUpdateBusinessIncomeFormData({
    formData: input.formData,
    year: input.year,
    month: input.month,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }

  const data = parsed.data;

  let rrnEncrypted = existing.rrnEncrypted;
  let rrnIv = existing.rrnIv;

  if (data.rrn) {
    const encrypted = encryptRRN(normalizeRRN(data.rrn));
    rrnEncrypted = encrypted.encrypted;
    rrnIv = encrypted.iv;
  }

  await prisma.$transaction(async (tx) => {
    await tx.businessIncome.update({
      where: { id: parsedId },
      data: {
        ...toBusinessIncomeData(data),
        rrnEncrypted,
        rrnIv,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: session.user.userId,
        companyId,
        action: "UPDATE",
        tableName: "business_incomes",
        recordId: parsedId,
        payload: toBusinessIncomeAuditPayload(data),
      },
    });
  });

  await afterDataMutation({
    session,
    companyId,
    entityType: "BUSINESS_INCOME",
    entityId: parsedId,
    action: "UPDATE",
  });

  revalidateBusinessIncomePaths(companyId);
  return { success: true };
}

export async function deleteBusinessIncome(
  id: string,
  explicitCompanyId?: string | null,
) {
  const session = await requireDataEditAuth();
  const companyId = resolveCompanyId(session, explicitCompanyId);
  const { id: parsedId } = idSchema.parse({ id });
  const existing = await getOwnedBusinessIncome(parsedId, companyId);

  await prisma.$transaction(async (tx) => {
    await tx.businessIncome.update({
      where: { id: parsedId },
      data: { deletedAt: new Date() },
    });

    await tx.auditLog.create({
      data: {
        actorId: session.user.userId,
        companyId,
        action: "DELETE",
        tableName: "business_incomes",
        recordId: parsedId,
        payload: {
          name: existing.name,
          year: existing.year,
          month: existing.month,
        },
      },
    });
  });

  await afterDataMutation({
    session,
    companyId,
    entityType: "BUSINESS_INCOME",
    entityId: parsedId,
    action: "DELETE",
  });

  revalidateBusinessIncomePaths(companyId);
}

export async function revealBusinessIncomeRRN(
  id: string,
  explicitCompanyId?: string | null,
) {
  const { rrnsById } = await revealBusinessIncomeRrns([id], explicitCompanyId);
  return { rrn: rrnsById[id]! };
}

export async function revealBusinessIncomeRrns(
  ids: string[],
  explicitCompanyId?: string | null,
) {
  const session = await requireDataEditAuth();
  const companyId = resolveCompanyId(session, explicitCompanyId);
  const parsedIds = rrnRecordIdsSchema.parse(ids);

  if (parsedIds.length === 0) {
    return { rrnsById: {} };
  }

  const uniqueIds = [...new Set(parsedIds)];
  const records = await prisma.businessIncome.findMany({
    where: { id: { in: uniqueIds }, companyId, deletedAt: null },
    select: { id: true, rrnEncrypted: true, rrnIv: true },
  });

  return {
    rrnsById: decryptRrnsForIds(
      records,
      uniqueIds,
      "사업소득 정보를 찾을 수 없습니다.",
    ),
  };
}

export async function deleteBusinessIncomeAction(formData: FormData) {
  const id = formData.get("id");
  await deleteBusinessIncome(
    String(id ?? ""),
    parseOptionalCompanyId(formData),
  );
}

export async function copyBusinessIncomeNamesFromMostRecentMonth(input: {
  companyId: string;
  year: number;
  month: number;
  mode: "overwrite" | "append";
}) {
  const session = await requireDataEditAuth();
  resolveCompanyId(session, input.companyId);
  const period = periodSchema.parse({ year: input.year, month: input.month });

  const mostRecent = await prisma.businessIncome.findFirst({
    where: {
      companyId: input.companyId,
      deletedAt: null,
      NOT: { year: period.year, month: period.month },
    },
    orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
    select: { year: true, month: true },
  });

  if (!mostRecent) {
    return { success: true as const, created: 0, skipped: 0 };
  }

  const source = await prisma.businessIncome.findMany({
    where: {
      companyId: input.companyId,
      year: mostRecent.year,
      month: mostRecent.month,
      deletedAt: null,
    },
    orderBy: [{ name: "asc" }, { createdAt: "asc" }],
    select: {
      name: true,
      rrnEncrypted: true,
      rrnIv: true,
    },
  });

  const sourceByName = new Map<
    string,
    { name: string; rrnEncrypted: string; rrnIv: string }
  >();
  for (const record of source) {
    const name = record.name.trim();
    if (!name || sourceByName.has(name)) {
      continue;
    }
    sourceByName.set(name, {
      name,
      rrnEncrypted: record.rrnEncrypted,
      rrnIv: record.rrnIv,
    });
  }

  const sourceEntries = [...sourceByName.values()];

  if (sourceEntries.length === 0) {
    return { success: true as const, created: 0, skipped: 0 };
  }

  const existing = await prisma.businessIncome.findMany({
    where: {
      companyId: input.companyId,
      year: period.year,
      month: period.month,
      deletedAt: null,
    },
    select: { id: true, name: true },
  });

  const existingNameSet = new Set(existing.map((r) => r.name.trim()));

  const toInsert =
    input.mode === "append"
      ? sourceEntries.filter((entry) => !existingNameSet.has(entry.name))
      : sourceEntries;

  const skipped =
    input.mode === "append" ? sourceEntries.length - toInsert.length : 0;

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    if (input.mode === "overwrite" && existing.length > 0) {
      await tx.businessIncome.updateMany({
        where: {
          companyId: input.companyId,
          year: period.year,
          month: period.month,
          deletedAt: null,
        },
        data: { deletedAt: now },
      });
    }

    if (toInsert.length > 0) {
      await tx.businessIncome.createMany({
        data: toInsert.map((entry) => ({
          companyId: input.companyId,
          createdById: session.user.userId,
          year: period.year,
          month: period.month,
          name: entry.name,
          rrnEncrypted: entry.rrnEncrypted,
          rrnIv: entry.rrnIv,
          incomeAmount: 0,
          incomeBasis: "GROSS",
          notes: null,
          deletedAt: null,
          createdAt: now,
          updatedAt: now,
        })),
      });
    }

    await tx.auditLog.create({
      data: {
        actorId: session.user.userId,
        companyId: input.companyId,
        action: "CREATE",
        tableName: "business_incomes",
        recordId: null,
        payload: {
          mode: input.mode,
          targetYear: period.year,
          targetMonth: period.month,
          sourceYear: mostRecent.year,
          sourceMonth: mostRecent.month,
          created: toInsert.length,
          skipped,
        },
      },
    });
  });

  await afterDataMutation({
    session,
    companyId: input.companyId,
    entityType: "BUSINESS_INCOME",
    action: "CREATE",
  });

  revalidateBusinessIncomePaths(input.companyId);
  return { success: true as const, created: toInsert.length, skipped };
}
