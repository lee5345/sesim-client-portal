"use server";

import { prisma } from "@/lib/db/db";
import { requireAuth } from "@/lib/auth/guards";
import { decryptRRN, maskRRN } from "@/lib/encryption/rrn";

export async function listCompanyNewHires(companyId: string) {
  await requireAuth(["FIRM_STAFF", "FIRM_ADMIN"]);

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

export async function revealCompanyNewHireRrn(id: string) {
  await requireAuth(["FIRM_STAFF", "FIRM_ADMIN"]);

  const record = await prisma.newHire.findFirst({
    where: { id, deletedAt: null },
    select: { rrnEncrypted: true, rrnIv: true },
  });

  if (!record) {
    throw new Error("입사자 정보를 찾을 수 없습니다.");
  }

  return {
    rrn: decryptRRN(record.rrnEncrypted, record.rrnIv),
  };
}

export async function listCompanyTerminations(companyId: string) {
  await requireAuth(["FIRM_STAFF", "FIRM_ADMIN"]);

  return prisma.termination.findMany({
    where: { companyId, deletedAt: null },
    orderBy: [{ terminationDate: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      terminationDate: true,
      reason: true,
      createdAt: true,
    },
  });
}
