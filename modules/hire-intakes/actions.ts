"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/db/db";
import { requireAuth } from "@/lib/auth/guards";
import { decryptRRN, encryptRRN, maskRRN } from "@/lib/encryption/rrn";
import {
  type CreateHireIntakeInput,
  normalizeRRN,
  parseCreateHireIntakeFormData,
  parseUpdateHireIntakeFormData,
  toAuditPayload,
} from "@/lib/validation/hire-intake";

const NEW_HIRES_PATH = "/client/new-hires";

export type HireIntakeActionResult =
  | { success: true }
  | { success: false; error: string };

const idSchema = z.object({
  id: z.string().uuid(),
});

function requireCompanyId(companyId: string | null | undefined): string {
  if (!companyId) {
    throw new Error("소속 회사 정보가 없습니다.");
  }
  return companyId;
}

function toHireIntakeData(
  input: Omit<CreateHireIntakeInput, "rrn">,
  rrnEncrypted: string,
  rrnIv: string,
) {
  return {
    name: input.name,
    email: input.email,
    rrnEncrypted,
    rrnIv,
    hireDate: input.hireDate,
    department: input.department,
    salaryType: input.salaryType,
    salaryBasis: input.salaryBasis,
    salaryAmount: input.salaryAmount,
    isContract: input.isContract,
    contractStart: input.isContract ? input.contractStart! : null,
    contractEnd: input.isContract ? input.contractEnd! : null,
  };
}

async function getOwnedHireIntake(id: string, companyId: string) {
  const record = await prisma.newHire.findFirst({
    where: { id, companyId, deletedAt: null },
  });

  if (!record) {
    throw new Error("입사자 정보를 찾을 수 없습니다.");
  }

  return record;
}

export async function listHireIntakes(companyId: string) {
  const records = await prisma.newHire.findMany({
    where: { companyId, deletedAt: null },
    orderBy: [{ hireDate: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      email: true,
      rrnEncrypted: true,
      rrnIv: true,
      hireDate: true,
      department: true,
      salaryType: true,
      salaryBasis: true,
      salaryAmount: true,
      isContract: true,
      contractStart: true,
      contractEnd: true,
      createdAt: true,
    },
  });

  return records.map((record) => {
    const plaintext = decryptRRN(record.rrnEncrypted, record.rrnIv);
    const { rrnEncrypted: _encrypted, rrnIv: _iv, ...rest } = record;
    return {
      ...rest,
      maskedRrn: maskRRN(plaintext),
    };
  });
}

export async function createHireIntake(
  formData: FormData,
): Promise<HireIntakeActionResult> {
  const session = await requireAuth("CLIENT_ADMIN");
  const companyId = requireCompanyId(session.user.companyId);
  const parsed = parseCreateHireIntakeFormData(formData);

  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }

  const input = parsed.data;
  const { encrypted, iv } = encryptRRN(normalizeRRN(input.rrn));

  await prisma.$transaction(async (tx) => {
    const record = await tx.newHire.create({
      data: {
        ...toHireIntakeData(input, encrypted, iv),
        companyId,
        createdById: session.user.userId,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: session.user.userId,
        companyId,
        action: "CREATE",
        tableName: "new_hires",
        recordId: record.id,
        payload: toAuditPayload(input),
      },
    });
  });

  revalidatePath(NEW_HIRES_PATH);
  return { success: true };
}

export async function updateHireIntake(
  id: string,
  formData: FormData,
): Promise<HireIntakeActionResult> {
  const session = await requireAuth("CLIENT_ADMIN");
  const companyId = requireCompanyId(session.user.companyId);
  const { id: parsedId } = idSchema.parse({ id });
  const existing = await getOwnedHireIntake(parsedId, companyId);
  const parsed = parseUpdateHireIntakeFormData(formData);

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

  const data = toHireIntakeData(input, rrnEncrypted, rrnIv);

  await prisma.$transaction(async (tx) => {
    await tx.newHire.update({
      where: { id: parsedId },
      data,
    });

    await tx.auditLog.create({
      data: {
        actorId: session.user.userId,
        companyId,
        action: "UPDATE",
        tableName: "new_hires",
        recordId: parsedId,
        payload: toAuditPayload(input),
      },
    });
  });

  revalidatePath(NEW_HIRES_PATH);
  return { success: true };
}

export async function deleteHireIntake(id: string) {
  const session = await requireAuth("CLIENT_ADMIN");
  const companyId = requireCompanyId(session.user.companyId);
  const { id: parsedId } = idSchema.parse({ id });
  const existing = await getOwnedHireIntake(parsedId, companyId);

  await prisma.$transaction(async (tx) => {
    await tx.newHire.update({
      where: { id: parsedId },
      data: { deletedAt: new Date() },
    });

    await tx.auditLog.create({
      data: {
        actorId: session.user.userId,
        companyId,
        action: "DELETE",
        tableName: "new_hires",
        recordId: parsedId,
        payload: {
          name: existing.name,
          email: existing.email,
        },
      },
    });
  });

  revalidatePath(NEW_HIRES_PATH);
}

export async function revealRRN(id: string) {
  const session = await requireAuth("CLIENT_ADMIN");
  const companyId = requireCompanyId(session.user.companyId);
  const { id: parsedId } = idSchema.parse({ id });
  const record = await getOwnedHireIntake(parsedId, companyId);

  return {
    rrn: decryptRRN(record.rrnEncrypted, record.rrnIv),
  };
}

export async function deleteHireIntakeAction(formData: FormData) {
  const id = formData.get("id");
  await deleteHireIntake(String(id ?? ""));
}
