"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/db/db";
import { decryptRRN, encryptRRN, maskRRN } from "@/lib/encryption/rrn";
import {
  parseOptionalCompanyId,
  requireDataEditAuth,
  resolveCompanyId,
} from "@/lib/permissions/crud";
import {
  normalizeRRN,
  parseCreateLeaveRecordFormData,
  parseUpdateLeaveRecordFormData,
  toLeaveRecordAuditPayload,
  type CreateLeaveRecordInput,
} from "@/lib/validation/leave-record";
import {
  listAttachmentSummariesByEntityIds,
  softDeleteEntityAttachments,
  syncEntityAttachments,
} from "@/modules/attachments/actions";
import {
  requiresChildInfo,
  requiresExpectedDeliveryDate,
  requiresHourReduction,
} from "@/modules/leave-records/constants";
import { afterDataMutation } from "@/modules/realtime/post-mutation";

const CLIENT_LEAVE_RECORDS_PATH = "/client/leave-records";

export type LeaveRecordActionResult =
  | { success: true }
  | { success: false; error: string };

const idSchema = z.object({
  id: z.string().uuid(),
});

function revalidateLeaveRecordPaths(companyId: string) {
  revalidatePath(`/firm/companies/${companyId}`);
  revalidatePath(CLIENT_LEAVE_RECORDS_PATH);
  revalidatePath("/firm/companies");
  revalidatePath("/firm", "layout");
  revalidatePath("/client", "layout");
}

function toLeaveRecordData(
  input: CreateLeaveRecordInput,
  childRrnEncrypted: string | null,
  childRrnIv: string | null,
) {
  return {
    name: input.name,
    leaveType: input.leaveType,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    expectedDeliveryDate: requiresExpectedDeliveryDate(input.leaveType)
      ? (input.expectedDeliveryDate ?? null)
      : null,
    childName: requiresChildInfo(input.leaveType) ? (input.childName ?? null) : null,
    childRrnEncrypted,
    childRrnIv,
    hoursBeforeReduction: requiresHourReduction(input.leaveType)
      ? (input.hoursBeforeReduction ?? null)
      : null,
    hoursAfterReduction: requiresHourReduction(input.leaveType)
      ? (input.hoursAfterReduction ?? null)
      : null,
  };
}

async function getOwnedLeaveRecord(id: string, companyId: string) {
  const record = await prisma.leaveRecord.findFirst({
    where: { id, companyId, deletedAt: null },
    select: { id: true, name: true },
  });

  if (!record) {
    throw new Error("휴직자 정보를 찾을 수 없습니다.");
  }

  return record;
}

export async function listLeaveRecords(companyId: string) {
  const session = await requireDataEditAuth();
  resolveCompanyId(session, companyId);

  const records = await prisma.leaveRecord.findMany({
    where: { companyId, deletedAt: null },
    orderBy: [{ periodStart: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      leaveType: true,
      periodStart: true,
      periodEnd: true,
      expectedDeliveryDate: true,
      childName: true,
      childRrnEncrypted: true,
      childRrnIv: true,
      hoursBeforeReduction: true,
      hoursAfterReduction: true,
      createdAt: true,
      createdBy: { select: { name: true } },
    },
  });

  const attachmentsByEntityId = await listAttachmentSummariesByEntityIds(
    companyId,
    "LEAVE_RECORD",
    records.map((record) => record.id),
  );

  return records.map((record) => {
    const maskedChildRrn =
      record.childRrnEncrypted && record.childRrnIv
        ? maskRRN(decryptRRN(record.childRrnEncrypted, record.childRrnIv))
        : null;
    const {
      childRrnEncrypted: _encrypted,
      childRrnIv: _iv,
      createdBy,
      ...rest
    } = record;

    return {
      ...rest,
      createdByName: createdBy.name,
      maskedChildRrn,
      attachments: attachmentsByEntityId[record.id] ?? [],
    };
  });
}

export async function createLeaveRecord(
  formData: FormData,
): Promise<LeaveRecordActionResult> {
  const session = await requireDataEditAuth();
  const companyId = resolveCompanyId(session, parseOptionalCompanyId(formData));
  const parsed = parseCreateLeaveRecordFormData(formData);

  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }

  const input = parsed.data;
  let childRrnEncrypted: string | null = null;
  let childRrnIv: string | null = null;

  if (requiresChildInfo(input.leaveType) && input.childRrn) {
    const { encrypted, iv } = encryptRRN(normalizeRRN(input.childRrn));
    childRrnEncrypted = encrypted;
    childRrnIv = iv;
  }

  const data = toLeaveRecordData(input, childRrnEncrypted, childRrnIv);
  let createdId: string | undefined;

  try {
    await prisma.$transaction(async (tx) => {
      const record = await tx.leaveRecord.create({
        data: {
          ...data,
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
          tableName: "leave_records",
          recordId: record.id,
          payload: toLeaveRecordAuditPayload(input),
        },
      });
    });

    await syncEntityAttachments({
      companyId,
      entityType: "LEAVE_RECORD",
      entityId: createdId!,
      actorId: session.user.userId,
      formData,
    });
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "휴직자 정보를 저장할 수 없습니다.",
    };
  }

  await afterDataMutation({
    session,
    companyId,
    entityType: "LEAVE_RECORD",
    entityId: createdId,
    action: "CREATE",
  });

  revalidateLeaveRecordPaths(companyId);
  return { success: true };
}

export async function updateLeaveRecord(
  id: string,
  formData: FormData,
): Promise<LeaveRecordActionResult> {
  const session = await requireDataEditAuth();
  const companyId = resolveCompanyId(session, parseOptionalCompanyId(formData));
  const { id: parsedId } = idSchema.parse({ id });
  await getOwnedLeaveRecord(parsedId, companyId);
  const parsed = parseUpdateLeaveRecordFormData(formData);

  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }

  const input = parsed.data;
  let childRrnEncrypted: string | null = null;
  let childRrnIv: string | null = null;

  if (requiresChildInfo(input.leaveType) && input.childRrn) {
    const { encrypted, iv } = encryptRRN(normalizeRRN(input.childRrn));
    childRrnEncrypted = encrypted;
    childRrnIv = iv;
  } else if (requiresChildInfo(input.leaveType)) {
    const existing = await prisma.leaveRecord.findFirst({
      where: { id: parsedId, companyId },
      select: { childRrnEncrypted: true, childRrnIv: true },
    });
    childRrnEncrypted = existing?.childRrnEncrypted ?? null;
    childRrnIv = existing?.childRrnIv ?? null;
  }

  const data = toLeaveRecordData(input, childRrnEncrypted, childRrnIv);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.leaveRecord.update({
        where: { id: parsedId },
        data,
      });

      await tx.auditLog.create({
        data: {
          actorId: session.user.userId,
          companyId,
          action: "UPDATE",
          tableName: "leave_records",
          recordId: parsedId,
          payload: toLeaveRecordAuditPayload(input),
        },
      });
    });

    await syncEntityAttachments({
      companyId,
      entityType: "LEAVE_RECORD",
      entityId: parsedId,
      actorId: session.user.userId,
      formData,
    });
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "휴직자 정보를 저장할 수 없습니다.",
    };
  }

  await afterDataMutation({
    session,
    companyId,
    entityType: "LEAVE_RECORD",
    entityId: parsedId,
    action: "UPDATE",
  });

  revalidateLeaveRecordPaths(companyId);
  return { success: true };
}

export async function deleteLeaveRecord(
  id: string,
  explicitCompanyId?: string | null,
) {
  const session = await requireDataEditAuth();
  const companyId = resolveCompanyId(session, explicitCompanyId);
  const { id: parsedId } = idSchema.parse({ id });
  const existing = await getOwnedLeaveRecord(parsedId, companyId);

  await prisma.$transaction(async (tx) => {
    await tx.leaveRecord.update({
      where: { id: parsedId },
      data: { deletedAt: new Date() },
    });

    await tx.auditLog.create({
      data: {
        actorId: session.user.userId,
        companyId,
        action: "DELETE",
        tableName: "leave_records",
        recordId: parsedId,
        payload: { name: existing.name },
      },
    });
  });

  await softDeleteEntityAttachments({
    companyId,
    entityType: "LEAVE_RECORD",
    entityId: parsedId,
  });

  await afterDataMutation({
    session,
    companyId,
    entityType: "LEAVE_RECORD",
    entityId: parsedId,
    action: "DELETE",
  });

  revalidateLeaveRecordPaths(companyId);
}

export async function deleteLeaveRecordAction(formData: FormData) {
  const id = formData.get("id");
  await deleteLeaveRecord(String(id ?? ""), parseOptionalCompanyId(formData));
}

export async function revealLeaveRecordChildRrn(
  id: string,
  explicitCompanyId?: string | null,
) {
  const session = await requireDataEditAuth();
  const companyId = resolveCompanyId(session, explicitCompanyId);
  const { id: parsedId } = idSchema.parse({ id });

  const record = await prisma.leaveRecord.findFirst({
    where: { id: parsedId, companyId, deletedAt: null },
    select: { childRrnEncrypted: true, childRrnIv: true },
  });

  if (!record?.childRrnEncrypted || !record.childRrnIv) {
    throw new Error("대상자녀 주민번호가 없습니다.");
  }

  return decryptRRN(record.childRrnEncrypted, record.childRrnIv);
}

export async function revealLeaveRecordChildRrns(
  ids: string[],
  explicitCompanyId?: string | null,
) {
  const session = await requireDataEditAuth();
  const companyId = resolveCompanyId(session, explicitCompanyId);
  const parsedIds = z.array(z.string().uuid()).parse(ids);

  const records = await prisma.leaveRecord.findMany({
    where: {
      id: { in: parsedIds },
      companyId,
      deletedAt: null,
      childRrnEncrypted: { not: null },
      childRrnIv: { not: null },
    },
    select: {
      id: true,
      childRrnEncrypted: true,
      childRrnIv: true,
    },
  });

  const rrnsById: Record<string, string> = {};
  for (const record of records) {
    if (record.childRrnEncrypted && record.childRrnIv) {
      rrnsById[record.id] = decryptRRN(record.childRrnEncrypted, record.childRrnIv);
    }
  }

  return { rrnsById };
}
