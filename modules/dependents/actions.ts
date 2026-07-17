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
  parseCreateDependentRecordFormData,
  parseUpdateDependentRecordFormData,
  toDependentRecordAuditPayload,
  type CreateDependentRecordInput,
} from "@/lib/validation/dependent-record";
import {
  listAttachmentSummariesByEntityIds,
  softDeleteEntityAttachments,
  syncEntityAttachments,
} from "@/modules/attachments/actions";
import { afterDataMutation } from "@/modules/realtime/post-mutation";

const CLIENT_DEPENDENTS_PATH = "/client/dependents";

export type DependentRecordActionResult =
  | { success: true }
  | { success: false; error: string };

const idSchema = z.object({
  id: z.string().uuid(),
});

function revalidateDependentRecordPaths(companyId: string) {
  revalidatePath(`/firm/companies/${companyId}`);
  revalidatePath(CLIENT_DEPENDENTS_PATH);
  revalidatePath("/firm/companies");
  revalidatePath("/firm", "layout");
  revalidatePath("/client", "layout");
}

function toDependentRecordData(input: CreateDependentRecordInput) {
  return {
    employeeName: input.employeeName,
    dependentName: input.dependentName,
    relationship: input.relationship,
    registrationRequestedDate: input.registrationRequestedDate,
  };
}

async function getOwnedDependentRecord(id: string, companyId: string) {
  const record = await prisma.dependentRecord.findFirst({
    where: { id, companyId, deletedAt: null },
    select: { id: true, employeeName: true, dependentName: true },
  });

  if (!record) {
    throw new Error("피부양자 정보를 찾을 수 없습니다.");
  }

  return record;
}

export async function listDependentRecords(companyId: string) {
  const session = await requireDataEditAuth();
  resolveCompanyId(session, companyId);

  const records = await prisma.dependentRecord.findMany({
    where: { companyId, deletedAt: null },
    orderBy: [
      { registrationRequestedDate: "desc" },
      { createdAt: "desc" },
    ],
    select: {
      id: true,
      employeeName: true,
      dependentName: true,
      relationship: true,
      registrationRequestedDate: true,
      createdAt: true,
      createdBy: { select: { name: true } },
    },
  });

  const attachmentsByEntityId = await listAttachmentSummariesByEntityIds(
    companyId,
    "DEPENDENT_RECORD",
    records.map((record) => record.id),
  );

  return records.map(({ createdBy, ...rest }) => ({
    ...rest,
    createdByName: createdBy.name,
    attachments: attachmentsByEntityId[rest.id] ?? [],
  }));
}

export async function createDependentRecord(
  formData: FormData,
): Promise<DependentRecordActionResult> {
  const session = await requireDataEditAuth();
  const companyId = resolveCompanyId(session, parseOptionalCompanyId(formData));
  const parsed = parseCreateDependentRecordFormData(formData);

  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }

  const input = parsed.data;
  const data = toDependentRecordData(input);
  let createdId: string | undefined;

  try {
    await prisma.$transaction(async (tx) => {
      const record = await tx.dependentRecord.create({
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
          tableName: "dependent_records",
          recordId: record.id,
          payload: toDependentRecordAuditPayload(input),
        },
      });
    });

    await syncEntityAttachments({
      companyId,
      entityType: "DEPENDENT_RECORD",
      entityId: createdId!,
      actorId: session.user.userId,
      formData,
    });
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "피부양자 정보를 저장할 수 없습니다.",
    };
  }

  await afterDataMutation({
    session,
    companyId,
    entityType: "DEPENDENT_RECORD",
    entityId: createdId,
    action: "CREATE",
  });

  revalidateDependentRecordPaths(companyId);
  return { success: true };
}

export async function updateDependentRecord(
  id: string,
  formData: FormData,
): Promise<DependentRecordActionResult> {
  const session = await requireDataEditAuth();
  const companyId = resolveCompanyId(session, parseOptionalCompanyId(formData));
  const { id: parsedId } = idSchema.parse({ id });
  await getOwnedDependentRecord(parsedId, companyId);
  const parsed = parseUpdateDependentRecordFormData(formData);

  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }

  const input = parsed.data;
  const data = toDependentRecordData(input);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.dependentRecord.update({
        where: { id: parsedId },
        data,
      });

      await tx.auditLog.create({
        data: {
          actorId: session.user.userId,
          companyId,
          action: "UPDATE",
          tableName: "dependent_records",
          recordId: parsedId,
          payload: toDependentRecordAuditPayload(input),
        },
      });
    });

    await syncEntityAttachments({
      companyId,
      entityType: "DEPENDENT_RECORD",
      entityId: parsedId,
      actorId: session.user.userId,
      formData,
    });
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "피부양자 정보를 저장할 수 없습니다.",
    };
  }

  await afterDataMutation({
    session,
    companyId,
    entityType: "DEPENDENT_RECORD",
    entityId: parsedId,
    action: "UPDATE",
  });

  revalidateDependentRecordPaths(companyId);
  return { success: true };
}

export async function deleteDependentRecord(
  id: string,
  explicitCompanyId?: string | null,
) {
  const session = await requireDataEditAuth();
  const companyId = resolveCompanyId(session, explicitCompanyId);
  const { id: parsedId } = idSchema.parse({ id });
  const existing = await getOwnedDependentRecord(parsedId, companyId);

  await prisma.$transaction(async (tx) => {
    await tx.dependentRecord.update({
      where: { id: parsedId },
      data: { deletedAt: new Date() },
    });

    await tx.auditLog.create({
      data: {
        actorId: session.user.userId,
        companyId,
        action: "DELETE",
        tableName: "dependent_records",
        recordId: parsedId,
        payload: {
          employeeName: existing.employeeName,
          dependentName: existing.dependentName,
        },
      },
    });
  });

  await softDeleteEntityAttachments({
    companyId,
    entityType: "DEPENDENT_RECORD",
    entityId: parsedId,
  });

  await afterDataMutation({
    session,
    companyId,
    entityType: "DEPENDENT_RECORD",
    entityId: parsedId,
    action: "DELETE",
  });

  revalidateDependentRecordPaths(companyId);
}

export async function deleteDependentRecordAction(formData: FormData) {
  const id = formData.get("id");
  await deleteDependentRecord(String(id ?? ""), parseOptionalCompanyId(formData));
}
