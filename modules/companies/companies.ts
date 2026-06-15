"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/db/db";
import { requireAuth } from "@/lib/auth/guards";
import { sortByKoreanName } from "@/lib/sort/korean";
import { optionalBusinessNumberSchema } from "@/lib/validation/business-number";
import { getFirstZodErrorMessage } from "@/lib/validation/zod-korean";

export type CompanyActionResult =
  | { success: true }
  | { success: false; error: string };

const companyFieldsSchema = z.object({
  name: z.string().trim().min(1, "회사명을 입력해 주세요.").max(100),
  businessNumber: optionalBusinessNumberSchema,
});

const createCompanySchema = companyFieldsSchema;

const updateCompanySchema = companyFieldsSchema.extend({
  companyId: z.string().uuid(),
  isActive: z.enum(["true", "false"]),
});

const companyIdSchema = z.object({
  companyId: z.string().uuid(),
});

const activeCompanySelect = {
  id: true,
  name: true,
  businessNumber: true,
  isActive: true,
  updatedAt: true,
  deletedAt: true,
  _count: {
    select: {
      newHires: { where: { deletedAt: null } },
      terminations: { where: { deletedAt: null } },
      compensationChanges: { where: { deletedAt: null } },
    },
  },
} as const;

export async function getPendingRegistrationRequestCount() {
  return prisma.registrationRequest.count({
    where: { status: "PENDING" },
  });
}

export async function listCompanies() {
  const companies = await prisma.company.findMany({
    where: { deletedAt: null },
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

  return sortByKoreanName(companies, (company) => company.name);
}

export async function listDeletedCompanies() {
  return prisma.company.findMany({
    where: { deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
    select: {
      id: true,
      name: true,
      businessNumber: true,
      deletedAt: true,
    },
  });
}

export async function getCompanyById(companyId: string) {
  return prisma.company.findFirst({
    where: { id: companyId, deletedAt: null },
    select: activeCompanySelect,
  });
}

export async function createCompanyAction(
  formData: FormData,
): Promise<CompanyActionResult> {
  await requireAuth("FIRM_ADMIN");

  const parsed = createCompanySchema.safeParse({
    name: formData.get("name"),
    businessNumber: formData.get("businessNumber") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: getFirstZodErrorMessage(parsed.error) };
  }

  const input = parsed.data;

  await prisma.company.create({
    data: {
      name: input.name,
      businessNumber: input.businessNumber,
    },
  });

  revalidatePath("/firm/companies");
  revalidatePath("/firm/dashboard");
  return { success: true };
}

export async function updateCompanyAction(
  formData: FormData,
): Promise<CompanyActionResult> {
  await requireAuth(["FIRM_STAFF", "FIRM_ADMIN"]);

  const parsed = updateCompanySchema.safeParse({
    companyId: formData.get("companyId"),
    name: formData.get("name"),
    businessNumber: formData.get("businessNumber") || undefined,
    isActive: formData.get("isActive"),
  });

  if (!parsed.success) {
    return { success: false, error: getFirstZodErrorMessage(parsed.error) };
  }

  const input = parsed.data;

  const existing = await prisma.company.findFirst({
    where: { id: input.companyId, deletedAt: null },
    select: { id: true },
  });
  if (!existing) {
    redirect("/firm/companies");
  }

  await prisma.company.update({
    where: { id: input.companyId },
    data: {
      name: input.name,
      businessNumber: input.businessNumber,
      isActive: input.isActive === "true",
    },
  });

  revalidatePath("/firm/companies");
  revalidatePath(`/firm/companies/${input.companyId}`);
  revalidatePath("/firm/dashboard");
  return { success: true };
}

export async function softDeleteCompanyAction(formData: FormData) {
  await requireAuth("FIRM_ADMIN");

  const input = companyIdSchema.parse({
    companyId: formData.get("companyId"),
  });

  const existing = await prisma.company.findFirst({
    where: { id: input.companyId, deletedAt: null },
    select: { id: true },
  });
  if (!existing) {
    redirect("/firm/companies");
  }

  await prisma.$transaction([
    prisma.company.update({
      where: { id: input.companyId },
      data: { deletedAt: new Date(), isActive: false },
    }),
    prisma.user.updateMany({
      where: { companyId: input.companyId },
      data: { isActive: false },
    }),
  ]);

  revalidatePath("/firm/companies");
  revalidatePath("/firm/companies/deleted");
  revalidatePath("/firm/dashboard");
  redirect("/firm/companies");
}

export async function restoreCompanyAction(formData: FormData) {
  await requireAuth("FIRM_ADMIN");

  const input = companyIdSchema.parse({
    companyId: formData.get("companyId"),
  });

  await prisma.company.update({
    where: { id: input.companyId },
    data: { deletedAt: null, isActive: true },
  });

  revalidatePath("/firm/companies");
  revalidatePath("/firm/companies/deleted");
  revalidatePath("/firm/dashboard");
}
