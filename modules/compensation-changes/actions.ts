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
  parseCreateCompensationChangeFormData,
  parseUpdateCompensationChangeFormData,
  toCompensationChangeAuditPayload,
  type CreateCompensationChangeInput,
} from "@/lib/validation/compensation-change";
import { afterDataMutation } from "@/modules/realtime/post-mutation";

const CLIENT_COMPENSATION_CHANGES_PATH = "/client/compensation-changes";

export type CompensationChangeActionResult =
  | { success: true }
  | { success: false; error: string };

const idSchema = z.object({
  id: z.string().uuid(),
});

function revalidateCompensationChangePaths(companyId: string) {
  revalidatePath(`/firm/companies/${companyId}`);
  revalidatePath(CLIENT_COMPENSATION_CHANGES_PATH);
  revalidatePath("/firm/companies");
  revalidatePath("/firm", "layout");
  revalidatePath("/client", "layout");
}

function toCompensationChangeData(input: CreateCompensationChangeInput) {
  return {
    name: input.name,
    changeDate: input.changeDate,
    salaryTypeBefore: input.salaryTypeBefore,
    salaryBasisBefore: input.salaryBasisBefore,
    salaryAmountBefore: input.salaryAmountBefore,
    salaryTypeAfter: input.salaryTypeAfter,
    salaryBasisAfter: input.salaryBasisAfter,
    salaryAmountAfter: input.salaryAmountAfter,
    notes: input.notes ?? null,
  };
}

async function getOwnedCompensationChange(id: string, companyId: string) {
  const record = await prisma.compensationChange.findFirst({
    where: { id, companyId, deletedAt: null },
    select: { id: true, name: true },
  });

  if (!record) {
    throw new Error("급여변경 정보를 찾을 수 없습니다.");
  }

  return record;
}

export async function listCompensationChanges(companyId: string) {
  const session = await requireDataEditAuth();
  resolveCompanyId(session, companyId);

  const records = await prisma.compensationChange.findMany({
    where: { companyId, deletedAt: null },
    orderBy: [{ changeDate: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      changeDate: true,
      salaryTypeBefore: true,
      salaryBasisBefore: true,
      salaryAmountBefore: true,
      salaryTypeAfter: true,
      salaryBasisAfter: true,
      salaryAmountAfter: true,
      notes: true,
      createdAt: true,
      createdBy: { select: { name: true } },
    },
  });

  return records.map(({ createdBy, ...rest }) => ({
    ...rest,
    createdByName: createdBy.name,
  }));
}

export async function createCompensationChange(
  formData: FormData,
): Promise<CompensationChangeActionResult> {
  const session = await requireDataEditAuth();
  const companyId = resolveCompanyId(session, parseOptionalCompanyId(formData));
  const parsed = parseCreateCompensationChangeFormData(formData);

  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }

  const input = parsed.data;
  const data = toCompensationChangeData(input);

  let createdId: string | undefined;

  await prisma.$transaction(async (tx) => {
    const record = await tx.compensationChange.create({
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
        tableName: "compensation_changes",
        recordId: record.id,
        payload: toCompensationChangeAuditPayload(input),
      },
    });
  });

  await afterDataMutation({
    session,
    companyId,
    entityType: "COMPENSATION_CHANGE",
    entityId: createdId,
    action: "CREATE",
  });

  revalidateCompensationChangePaths(companyId);
  return { success: true };
}

export async function updateCompensationChange(
  id: string,
  formData: FormData,
): Promise<CompensationChangeActionResult> {
  const session = await requireDataEditAuth();
  const companyId = resolveCompanyId(session, parseOptionalCompanyId(formData));
  const { id: parsedId } = idSchema.parse({ id });
  await getOwnedCompensationChange(parsedId, companyId);
  const parsed = parseUpdateCompensationChangeFormData(formData);

  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }

  const input = parsed.data;
  const data = toCompensationChangeData(input);

  await prisma.$transaction(async (tx) => {
    await tx.compensationChange.update({
      where: { id: parsedId },
      data,
    });

    await tx.auditLog.create({
      data: {
        actorId: session.user.userId,
        companyId,
        action: "UPDATE",
        tableName: "compensation_changes",
        recordId: parsedId,
        payload: toCompensationChangeAuditPayload(input),
      },
    });
  });

  await afterDataMutation({
    session,
    companyId,
    entityType: "COMPENSATION_CHANGE",
    entityId: parsedId,
    action: "UPDATE",
  });

  revalidateCompensationChangePaths(companyId);
  return { success: true };
}

export async function deleteCompensationChange(
  id: string,
  explicitCompanyId?: string | null,
) {
  const session = await requireDataEditAuth();
  const companyId = resolveCompanyId(session, explicitCompanyId);
  const { id: parsedId } = idSchema.parse({ id });
  const existing = await getOwnedCompensationChange(parsedId, companyId);

  await prisma.$transaction(async (tx) => {
    await tx.compensationChange.update({
      where: { id: parsedId },
      data: { deletedAt: new Date() },
    });

    await tx.auditLog.create({
      data: {
        actorId: session.user.userId,
        companyId,
        action: "DELETE",
        tableName: "compensation_changes",
        recordId: parsedId,
        payload: {
          name: existing.name,
        },
      },
    });
  });

  await afterDataMutation({
    session,
    companyId,
    entityType: "COMPENSATION_CHANGE",
    entityId: parsedId,
    action: "DELETE",
  });

  revalidateCompensationChangePaths(companyId);
}

export async function deleteCompensationChangeAction(formData: FormData) {
  const id = formData.get("id");
  await deleteCompensationChange(String(id ?? ""), parseOptionalCompanyId(formData));
}

