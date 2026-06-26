"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/db/db";
import { decryptRRN, encryptRRN, maskRRN } from "@/lib/encryption/rrn";
import {
  isFirmRole,
  parseOptionalCompanyId,
  requireDataEditAuth,
  resolveCompanyId,
} from "@/lib/permissions/crud";
import {
  type CreateTerminationInput,
  normalizeRRN,
  parseCreateTerminationFormData,
  parseUpdateTerminationFormData,
  toTerminationAuditPayload,
} from "@/lib/validation/termination";

const CLIENT_TERMINATIONS_PATH = "/client/terminations";

export type TerminationActionResult =
  | { success: true }
  | { success: false; error: string };

const idSchema = z.object({
  id: z.string().uuid(),
});

function revalidateTerminationPaths(
  companyId: string,
  role: Awaited<ReturnType<typeof requireDataEditAuth>>["user"]["role"],
) {
  if (isFirmRole(role)) {
    revalidatePath(`/firm/companies/${companyId}`);
  } else {
    revalidatePath(CLIENT_TERMINATIONS_PATH);
  }
}

function toTerminationData(
  input: Omit<CreateTerminationInput, "rrn">,
  rrnEncrypted: string,
  rrnIv: string,
) {
  return {
    name: input.name,
    rrnEncrypted,
    rrnIv,
    hireDate: input.hireDate ?? null,
    terminationDate: input.terminationDate,
    reason: input.reason,
    retirementPayType: input.retirementPayType,
    notes: input.notes ?? null,
  };
}

async function getOwnedTermination(id: string, companyId: string) {
  const record = await prisma.termination.findFirst({
    where: { id, companyId, deletedAt: null },
  });

  if (!record) {
    throw new Error("퇴사자 정보를 찾을 수 없습니다.");
  }

  return record;
}

export async function listTerminations(companyId: string) {
  const session = await requireDataEditAuth();
  resolveCompanyId(session, companyId);

  const records = await prisma.termination.findMany({
    where: { companyId, deletedAt: null },
    orderBy: [{ terminationDate: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      rrnEncrypted: true,
      rrnIv: true,
      hireDate: true,
      terminationDate: true,
      reason: true,
      retirementPayType: true,
      notes: true,
      createdAt: true,
      createdBy: {
        select: { name: true },
      },
    },
  });

  return records.map((record) => {
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
  });
}

export async function createTermination(
  formData: FormData,
): Promise<TerminationActionResult> {
  const session = await requireDataEditAuth();
  const companyId = resolveCompanyId(
    session,
    parseOptionalCompanyId(formData),
  );
  const parsed = parseCreateTerminationFormData(formData);

  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }

  const input = parsed.data;
  const { encrypted, iv } = encryptRRN(normalizeRRN(input.rrn));

  await prisma.$transaction(async (tx) => {
    const record = await tx.termination.create({
      data: {
        ...toTerminationData(input, encrypted, iv),
        company: { connect: { id: companyId } },
        createdBy: { connect: { id: session.user.userId } },
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: session.user.userId,
        companyId,
        action: "CREATE",
        tableName: "terminations",
        recordId: record.id,
        payload: toTerminationAuditPayload(input),
      },
    });
  });

  revalidateTerminationPaths(companyId, session.user.role);
  return { success: true };
}

export async function updateTermination(
  id: string,
  formData: FormData,
): Promise<TerminationActionResult> {
  const session = await requireDataEditAuth();
  const companyId = resolveCompanyId(
    session,
    parseOptionalCompanyId(formData),
  );
  const { id: parsedId } = idSchema.parse({ id });
  const existing = await getOwnedTermination(parsedId, companyId);
  const parsed = parseUpdateTerminationFormData(formData);

  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }

  const input = parsed.data;

  let rrnEncrypted = existing.rrnEncrypted;
  let rrnIv = existing.rrnIv;

  if (input.rrn) {
    const encrypted = encryptRRN(normalizeRRN(input.rrn));
    rrnEncrypted = encrypted.encrypted;
    rrnIv = encrypted.iv;
  }

  const data = toTerminationData(input, rrnEncrypted, rrnIv);

  await prisma.$transaction(async (tx) => {
    await tx.termination.update({
      where: { id: parsedId },
      data,
    });

    await tx.auditLog.create({
      data: {
        actorId: session.user.userId,
        companyId,
        action: "UPDATE",
        tableName: "terminations",
        recordId: parsedId,
        payload: toTerminationAuditPayload(input),
      },
    });
  });

  revalidateTerminationPaths(companyId, session.user.role);
  return { success: true };
}

export async function deleteTermination(
  id: string,
  explicitCompanyId?: string | null,
) {
  const session = await requireDataEditAuth();
  const companyId = resolveCompanyId(session, explicitCompanyId);
  const { id: parsedId } = idSchema.parse({ id });
  const existing = await getOwnedTermination(parsedId, companyId);

  await prisma.$transaction(async (tx) => {
    await tx.termination.update({
      where: { id: parsedId },
      data: { deletedAt: new Date() },
    });

    await tx.auditLog.create({
      data: {
        actorId: session.user.userId,
        companyId,
        action: "DELETE",
        tableName: "terminations",
        recordId: parsedId,
        payload: {
          name: existing.name,
        },
      },
    });
  });

  revalidateTerminationPaths(companyId, session.user.role);
}

export async function revealTerminationRRN(
  id: string,
  explicitCompanyId?: string | null,
) {
  const session = await requireDataEditAuth();
  const companyId = resolveCompanyId(session, explicitCompanyId);
  const { id: parsedId } = idSchema.parse({ id });
  const record = await getOwnedTermination(parsedId, companyId);

  return {
    rrn: decryptRRN(record.rrnEncrypted, record.rrnIv),
  };
}

export async function deleteTerminationAction(formData: FormData) {
  const id = formData.get("id");
  await deleteTermination(
    String(id ?? ""),
    parseOptionalCompanyId(formData),
  );
}
