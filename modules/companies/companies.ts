"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/db/db";
import { requireAuth } from "@/lib/auth/guards";

const createCompanySchema = z.object({
  name: z.string().trim().min(1, "회사명을 입력해 주세요.").max(100),
  businessNumber: z
    .string()
    .trim()
    .max(20)
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export async function getPendingRegistrationRequestCount() {
  return prisma.registrationRequest.count({
    where: { status: "PENDING" },
  });
}

export async function listCompanies(search?: string) {
  const where = {
    ...(search?.trim()
      ? { name: { contains: search.trim(), mode: "insensitive" as const } }
      : {}),
  };

  const companies = await prisma.company.findMany({
    where,
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      businessNumber: true,
      isActive: true,
      updatedAt: true,
      _count: {
        select: {
          newHires: { where: { deletedAt: null } },
          terminations: { where: { deletedAt: null } },
        },
      },
    },
  });

  return companies;
}

export async function getCompanyById(companyId: string) {
  return prisma.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      name: true,
      businessNumber: true,
      isActive: true,
      updatedAt: true,
      _count: {
        select: {
          newHires: { where: { deletedAt: null } },
          terminations: { where: { deletedAt: null } },
          compensationChanges: { where: { deletedAt: null } },
        },
      },
    },
  });
}

export async function createCompanyAction(formData: FormData) {
  await requireAuth("FIRM_ADMIN");

  const input = createCompanySchema.parse({
    name: formData.get("name"),
    businessNumber: formData.get("businessNumber") || undefined,
  });

  await prisma.company.create({
    data: {
      name: input.name,
      businessNumber: input.businessNumber,
    },
  });

  revalidatePath("/firm/companies");
  revalidatePath("/firm/dashboard");
}
