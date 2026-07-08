"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/db/db";
import {
  parseOptionalCompanyId,
  requireDataEditAuth,
  resolveCompanyId,
} from "@/lib/permissions/crud";
import {
  parseCompensationInfoFormData,
  toCompensationInfoAuditPayload,
} from "@/lib/validation/compensation-info";
import { afterDataMutation } from "@/modules/realtime/post-mutation";

const CLIENT_COMPENSATION_INFO_PATH = "/client/compensation-info";

export type CompensationInfoActionResult =
  | { success: true }
  | { success: false; error: string };

const idSchema = z.object({
  id: z.string().uuid(),
});

const periodSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

function revalidateCompensationInfoPaths(companyId: string) {
  revalidatePath(`/firm/companies/${companyId}`);
  revalidatePath(CLIENT_COMPENSATION_INFO_PATH);
  revalidatePath("/firm/companies");
  revalidatePath("/firm", "layout");
  revalidatePath("/client", "layout");
}

function decimalToNumber(value: { toNumber(): number } | null): number | null {
  if (value === null) {
    return null;
  }
  return value.toNumber();
}

async function getOwnedCompensationInfo(id: string, companyId: string) {
  const record = await prisma.compensationInfo.findFirst({
    where: { id, companyId, deletedAt: null },
    select: { id: true, name: true, year: true, month: true },
  });

  if (!record) {
    throw new Error("상세급여 정보를 찾을 수 없습니다.");
  }

  return record;
}

export async function listCompensationInfos(
  companyId: string,
  year: number,
  month: number,
) {
  const session = await requireDataEditAuth();
  resolveCompanyId(session, companyId);
  const period = periodSchema.parse({ year, month });

  const records = await prisma.compensationInfo.findMany({
    where: {
      companyId,
      year: period.year,
      month: period.month,
      deletedAt: null,
    },
    orderBy: [{ name: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      year: true,
      month: true,
      name: true,
      overtimeHours: true,
      holidayHours: true,
      nightHours: true,
      absenceDays: true,
      lateEarlyLeaveHours: true,
      incentiveAmount: true,
      unusedLeaveUnit: true,
      unusedLeaveAmount: true,
      notes: true,
      createdAt: true,
      createdBy: { select: { name: true } },
    },
  });

  return records.map(({ createdBy, ...rest }) => ({
    ...rest,
    overtimeHours: decimalToNumber(rest.overtimeHours ?? null),
    holidayHours: decimalToNumber(rest.holidayHours ?? null),
    nightHours: decimalToNumber(rest.nightHours ?? null),
    lateEarlyLeaveHours: decimalToNumber(rest.lateEarlyLeaveHours ?? null),
    unusedLeaveAmount: decimalToNumber(rest.unusedLeaveAmount ?? null),
    createdByName: createdBy.name,
  }));
}

export async function createCompensationInfo(input: {
  year: number;
  month: number;
  formData: FormData;
}): Promise<CompensationInfoActionResult> {
  const session = await requireDataEditAuth();
  const companyId = resolveCompanyId(
    session,
    parseOptionalCompanyId(input.formData),
  );
  const parsed = parseCompensationInfoFormData({
    formData: input.formData,
    year: input.year,
    month: input.month,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }

  const data = parsed.data;

  let createdId: string | undefined;

  await prisma.$transaction(async (tx) => {
    const record = await tx.compensationInfo.create({
      data: {
        year: data.year,
        month: data.month,
        name: data.name,
        overtimeHours: data.overtimeHours ?? null,
        holidayHours: data.holidayHours ?? null,
        nightHours: data.nightHours ?? null,
        absenceDays: data.absenceDays ?? null,
        lateEarlyLeaveHours: data.lateEarlyLeaveHours ?? null,
        incentiveAmount: data.incentiveAmount ?? null,
        unusedLeaveUnit: data.unusedLeaveUnit ?? null,
        unusedLeaveAmount: data.unusedLeaveAmount ?? null,
        notes: data.notes ?? null,
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
        tableName: "compensation_infos",
        recordId: record.id,
        payload: toCompensationInfoAuditPayload(data),
      },
    });
  });

  await afterDataMutation({
    session,
    companyId,
    entityType: "COMPENSATION_INFO",
    entityId: createdId,
    action: "CREATE",
  });

  revalidateCompensationInfoPaths(companyId);
  return { success: true };
}

export async function updateCompensationInfo(input: {
  id: string;
  year: number;
  month: number;
  formData: FormData;
}): Promise<CompensationInfoActionResult> {
  const session = await requireDataEditAuth();
  const companyId = resolveCompanyId(
    session,
    parseOptionalCompanyId(input.formData),
  );
  const { id } = idSchema.parse({ id: input.id });
  await getOwnedCompensationInfo(id, companyId);
  const parsed = parseCompensationInfoFormData({
    formData: input.formData,
    year: input.year,
    month: input.month,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }

  const data = parsed.data;

  await prisma.$transaction(async (tx) => {
    await tx.compensationInfo.update({
      where: { id },
      data: {
        name: data.name,
        overtimeHours: data.overtimeHours ?? null,
        holidayHours: data.holidayHours ?? null,
        nightHours: data.nightHours ?? null,
        absenceDays: data.absenceDays ?? null,
        lateEarlyLeaveHours: data.lateEarlyLeaveHours ?? null,
        incentiveAmount: data.incentiveAmount ?? null,
        unusedLeaveUnit: data.unusedLeaveUnit ?? null,
        unusedLeaveAmount: data.unusedLeaveAmount ?? null,
        notes: data.notes ?? null,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: session.user.userId,
        companyId,
        action: "UPDATE",
        tableName: "compensation_infos",
        recordId: id,
        payload: toCompensationInfoAuditPayload(data),
      },
    });
  });

  await afterDataMutation({
    session,
    companyId,
    entityType: "COMPENSATION_INFO",
    entityId: id,
    action: "UPDATE",
  });

  revalidateCompensationInfoPaths(companyId);
  return { success: true };
}

export async function deleteCompensationInfo(
  id: string,
  explicitCompanyId?: string | null,
) {
  const session = await requireDataEditAuth();
  const companyId = resolveCompanyId(session, explicitCompanyId);
  const { id: parsedId } = idSchema.parse({ id });
  const existing = await getOwnedCompensationInfo(parsedId, companyId);

  await prisma.$transaction(async (tx) => {
    await tx.compensationInfo.update({
      where: { id: parsedId },
      data: { deletedAt: new Date() },
    });

    await tx.auditLog.create({
      data: {
        actorId: session.user.userId,
        companyId,
        action: "DELETE",
        tableName: "compensation_infos",
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
    entityType: "COMPENSATION_INFO",
    entityId: parsedId,
    action: "DELETE",
  });

  revalidateCompensationInfoPaths(companyId);
}

export async function deleteCompensationInfoAction(formData: FormData) {
  const id = formData.get("id");
  await deleteCompensationInfo(String(id ?? ""), parseOptionalCompanyId(formData));
}

export async function copyCompensationInfoNamesFromMostRecentMonth(input: {
  companyId: string;
  year: number;
  month: number;
  mode: "overwrite" | "append";
}) {
  const session = await requireDataEditAuth();
  resolveCompanyId(session, input.companyId);
  const period = periodSchema.parse({ year: input.year, month: input.month });

  const mostRecent = await prisma.compensationInfo.findFirst({
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

  const source = await prisma.compensationInfo.findMany({
    where: {
      companyId: input.companyId,
      year: mostRecent.year,
      month: mostRecent.month,
      deletedAt: null,
    },
    orderBy: [{ name: "asc" }, { createdAt: "asc" }],
    select: { name: true },
  });

  const sourceNames = [...new Set(source.map((r) => r.name.trim()).filter(Boolean))];

  if (sourceNames.length === 0) {
    return { success: true as const, created: 0, skipped: 0 };
  }

  const existing = await prisma.compensationInfo.findMany({
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
      ? sourceNames.filter((name) => !existingNameSet.has(name))
      : sourceNames;

  const skipped = input.mode === "append" ? sourceNames.length - toInsert.length : 0;

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    if (input.mode === "overwrite" && existing.length > 0) {
      await tx.compensationInfo.updateMany({
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
      await tx.compensationInfo.createMany({
        data: toInsert.map((name) => ({
          companyId: input.companyId,
          createdById: session.user.userId,
          year: period.year,
          month: period.month,
          name,
          overtimeHours: null,
          holidayHours: null,
          nightHours: null,
          absenceDays: null,
          lateEarlyLeaveHours: null,
          incentiveAmount: null,
          unusedLeaveUnit: null,
          unusedLeaveAmount: null,
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
        tableName: "compensation_infos",
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
    entityType: "COMPENSATION_INFO",
    action: "CREATE",
  });

  revalidateCompensationInfoPaths(input.companyId);
  return { success: true as const, created: toInsert.length, skipped };
}

