"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db/db";
import {
  isFirmRole,
  parseOptionalCompanyId,
  requireDataEditAuth,
  resolveCompanyId,
} from "@/lib/permissions/crud";
import { decryptRRN, encryptRRN, maskRRN } from "@/lib/encryption/rrn";
import {
  decryptRrnsForIds,
  rrnRecordIdsSchema,
} from "@/lib/encryption/reveal-rrns-bulk";
import {
  type CreateHireIntakeInput,
  normalizeRRN,
  parseCreateHireIntakeFormData,
  parseUpdateHireIntakeFormData,
  parseStoredNonTaxableAllowances,
  toAuditPayload,
} from "@/lib/validation/hire-intake";

const CLIENT_NEW_HIRES_PATH = "/client/new-hires";

export type HireIntakeActionResult =
  | { success: true }
  | { success: false; error: string };

const idSchema = z.object({
  id: z.string().uuid(),
});

function revalidateHireIntakePaths(
  companyId: string,
  role: Awaited<ReturnType<typeof requireDataEditAuth>>["user"]["role"],
) {
  if (isFirmRole(role)) {
    revalidatePath(`/firm/companies/${companyId}`);
  } else {
    revalidatePath(CLIENT_NEW_HIRES_PATH);
  }
}

function toHireIntakeData(
  input: Omit<CreateHireIntakeInput, "rrn">,
  rrnEncrypted: string,
  rrnIv: string,
) {
  return {
    name: input.name,
    email: input.email ?? null,
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
    nonTaxableAllowances:
      input.nonTaxableAllowances && input.nonTaxableAllowances.length > 0
        ? (input.nonTaxableAllowances as Prisma.InputJsonValue)
        : Prisma.DbNull,
    bankName: input.bankName ?? null,
    accountNumber: input.accountNumber ?? null,
    phone: input.phone ?? null,
    notes: input.notes ?? null,
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
  const session = await requireDataEditAuth();
  resolveCompanyId(session, companyId);

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
      nonTaxableAllowances: true,
      bankName: true,
      accountNumber: true,
      phone: true,
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
      nonTaxableAllowances: parseStoredNonTaxableAllowances(
        record.nonTaxableAllowances,
      ),
      createdByName: createdBy.name,
      maskedRrn: maskRRN(plaintext),
    };
  });
}

export async function createHireIntake(
  formData: FormData,
): Promise<HireIntakeActionResult> {
  const session = await requireDataEditAuth();
  const companyId = resolveCompanyId(
    session,
    parseOptionalCompanyId(formData),
  );
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
        company: { connect: { id: companyId } },
        createdBy: { connect: { id: session.user.userId } },
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

  revalidateHireIntakePaths(companyId, session.user.role);
  return { success: true };
}

export async function updateHireIntake(
  id: string,
  formData: FormData,
): Promise<HireIntakeActionResult> {
  const session = await requireDataEditAuth();
  const companyId = resolveCompanyId(
    session,
    parseOptionalCompanyId(formData),
  );
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

  revalidateHireIntakePaths(companyId, session.user.role);
  return { success: true };
}

export async function deleteHireIntake(
  id: string,
  explicitCompanyId?: string | null,
) {
  const session = await requireDataEditAuth();
  const companyId = resolveCompanyId(session, explicitCompanyId);
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

  revalidateHireIntakePaths(companyId, session.user.role);
}

export async function revealRRN(
  id: string,
  explicitCompanyId?: string | null,
) {
  const { rrnsById } = await revealRRNs([id], explicitCompanyId);
  return { rrn: rrnsById[id]! };
}

export async function revealRRNs(
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
  const records = await prisma.newHire.findMany({
    where: { id: { in: uniqueIds }, companyId, deletedAt: null },
    select: { id: true, rrnEncrypted: true, rrnIv: true },
  });

  return {
    rrnsById: decryptRrnsForIds(
      records,
      uniqueIds,
      "입사자 정보를 찾을 수 없습니다.",
    ),
  };
}

export async function deleteHireIntakeAction(formData: FormData) {
  const id = formData.get("id");
  await deleteHireIntake(
    String(id ?? ""),
    parseOptionalCompanyId(formData),
  );
}
