"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/db/db";
import { requireAuth } from "@/lib/auth/guards";
import { sortCompaniesByActivity } from "@/lib/sort/korean";
import { optionalWorkplaceManagementNumberSchema } from "@/lib/validation/workplace-management-number";
import { getFirstZodErrorMessage } from "@/lib/validation/zod-korean";
import { afterDataMutation, afterFirmScopeMutation } from "@/modules/realtime/post-mutation";

export type CompanyActionResult =
  | { success: true }
  | { success: false; error: string };

const companyFieldsSchema = z.object({
  name: z.string().trim().min(1, "회사명을 입력해 주세요.").max(100),
  workplaceManagementNumber: optionalWorkplaceManagementNumberSchema,
});

const createCompanySchema = companyFieldsSchema;

const updateCompanySchema = companyFieldsSchema.extend({
  companyId: z.string().uuid(),
  isActive: z.enum(["true", "false"]),
  firmContactName: z
    .string()
    .trim()
    .max(50)
    .optional()
    .transform((value) => value || null),
});

const companyIdSchema = z.object({
  companyId: z.string().uuid(),
});

const activeCompanySelect = {
  id: true,
  name: true,
  firmContactName: true,
  businessNumber: true,
  workplaceManagementNumber: true,
  isActive: true,
  updatedAt: true,
  deletedAt: true,
  _count: {
    select: {
      newHires: { where: { deletedAt: null } },
      terminations: { where: { deletedAt: null } },
      compensationChanges: { where: { deletedAt: null } },
      dailyWorkers: { where: { deletedAt: null } },
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
      firmContactName: true,
      workplaceManagementNumber: true,
      isActive: true,
      updatedAt: true,
    },
  });

  return sortCompaniesByActivity(companies);
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
    workplaceManagementNumber: formData.get("workplaceManagementNumber") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: getFirstZodErrorMessage(parsed.error) };
  }

  const input = parsed.data;

  await prisma.company.create({
    data: {
      name: input.name,
      workplaceManagementNumber: input.workplaceManagementNumber,
    },
  });

  await afterFirmScopeMutation();

  revalidatePath("/firm/companies");
  revalidatePath("/firm/dashboard");
  return { success: true };
}

export async function updateCompanyAction(
  formData: FormData,
): Promise<CompanyActionResult> {
  const session = await requireAuth("FIRM_ADMIN");

  const parsed = updateCompanySchema.safeParse({
    companyId: formData.get("companyId"),
    name: formData.get("name"),
    workplaceManagementNumber: formData.get("workplaceManagementNumber") || undefined,
    isActive: formData.get("isActive"),
    firmContactName: formData.get("firmContactName") || undefined,
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
      workplaceManagementNumber: input.workplaceManagementNumber,
      firmContactName: input.firmContactName,
      isActive: input.isActive === "true",
    },
  });

  await afterDataMutation({
    session,
    companyId: input.companyId,
    entityType: "COMPANY_PROFILE",
    entityId: input.companyId,
    action: "UPDATE",
  });

  revalidatePath("/firm/companies");
  revalidatePath(`/firm/companies/${input.companyId}`);
  revalidatePath(`/firm/companies/${input.companyId}/info`);
  revalidatePath("/firm/dashboard");
  revalidatePath("/client/settings");
  revalidatePath("/client", "layout");
  revalidatePath("/firm", "layout");
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

  const existing = await prisma.company.findFirst({
    where: { id: input.companyId, deletedAt: { not: null } },
    select: { id: true },
  });
  if (!existing) {
    redirect("/firm/companies/deleted");
  }

  await prisma.company.update({
    where: { id: input.companyId },
    data: { deletedAt: null, isActive: true },
  });

  revalidatePath("/firm/companies");
  revalidatePath("/firm/companies/deleted");
  revalidatePath("/firm/dashboard");
}

export async function permanentlyDeleteCompanyAction(formData: FormData) {
  await requireAuth("FIRM_ADMIN");

  const input = companyIdSchema.parse({
    companyId: formData.get("companyId"),
  });

  const existing = await prisma.company.findFirst({
    where: { id: input.companyId, deletedAt: { not: null } },
    select: { id: true },
  });
  if (!existing) {
    redirect("/firm/companies/deleted");
  }

  const companyId = input.companyId;

  await prisma.$transaction(async (tx) => {
    await tx.newHire.deleteMany({ where: { companyId } });
    await tx.termination.deleteMany({ where: { companyId } });
    await tx.compensationChange.deleteMany({ where: { companyId } });
    await tx.department.deleteMany({ where: { companyId } });
    await tx.auditLog.deleteMany({ where: { companyId } });

    const userIds = (
      await tx.user.findMany({
        where: { companyId },
        select: { id: true },
      })
    ).map((user) => user.id);

    if (userIds.length > 0) {
      await tx.auditLog.deleteMany({ where: { actorId: { in: userIds } } });
      await tx.passwordSetupToken.deleteMany({
        where: { userId: { in: userIds } },
      });
      await tx.user.deleteMany({ where: { companyId } });
    }

    await tx.registrationRequest.updateMany({
      where: { companyId },
      data: { companyId: null },
    });

    await tx.company.delete({ where: { id: companyId } });
  });

  revalidatePath("/firm/companies");
  revalidatePath("/firm/companies/deleted");
  revalidatePath("/firm/dashboard");
  revalidatePath("/firm/client-accounts");
  redirect("/firm/companies/deleted");
}
