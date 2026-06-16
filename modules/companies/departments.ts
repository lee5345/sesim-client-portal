"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/db/db";
import {
  isFirmRole,
  parseOptionalCompanyId,
  requireDataEditAuth,
  resolveCompanyId,
} from "@/lib/permissions/crud";

const departmentNameSchema = z
  .string()
  .trim()
  .min(1, "부서명을 입력해 주세요.")
  .max(50, "부서명은 50자 이하여야 합니다.");

const createDepartmentSchema = z.object({
  name: departmentNameSchema,
  companyId: z.string().uuid(),
});

const deleteDepartmentSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
});

function revalidateDepartmentPaths(
  companyId: string,
  role: Awaited<ReturnType<typeof requireDataEditAuth>>["user"]["role"],
) {
  if (isFirmRole(role)) {
    revalidatePath(`/firm/companies/${companyId}`);
  } else {
    revalidatePath("/client/settings");
    revalidatePath("/client/new-hires");
  }
}

export async function listDepartments(companyId: string) {
  const session = await requireDataEditAuth();
  resolveCompanyId(session, companyId);

  return prisma.department.findMany({
    where: { companyId, deletedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true, createdAt: true },
  });
}

export async function createDepartment(name: string, companyId: string) {
  const session = await requireDataEditAuth();
  const scopedCompanyId = resolveCompanyId(session, companyId);
  const input = createDepartmentSchema.parse({
    name,
    companyId: scopedCompanyId,
  });

  const existing = await prisma.department.findFirst({
    where: {
      companyId: input.companyId,
      name: input.name,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (existing) {
    throw new Error("이미 등록된 부서명입니다.");
  }

  await prisma.department.create({
    data: {
      name: input.name,
      companyId: input.companyId,
    },
  });

  revalidateDepartmentPaths(scopedCompanyId, session.user.role);
}

export async function deleteDepartment(id: string, companyId: string) {
  const session = await requireDataEditAuth();
  const scopedCompanyId = resolveCompanyId(session, companyId);
  const input = deleteDepartmentSchema.parse({
    id,
    companyId: scopedCompanyId,
  });

  const department = await prisma.department.findFirst({
    where: {
      id: input.id,
      companyId: input.companyId,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!department) {
    throw new Error("부서를 찾을 수 없습니다.");
  }

  await prisma.department.update({
    where: { id: input.id },
    data: { deletedAt: new Date() },
  });

  revalidateDepartmentPaths(scopedCompanyId, session.user.role);
}

export async function createDepartmentAction(formData: FormData) {
  const session = await requireDataEditAuth();
  const companyId = resolveCompanyId(
    session,
    parseOptionalCompanyId(formData),
  );
  const name = formData.get("name");
  await createDepartment(String(name ?? ""), companyId);
}

export async function deleteDepartmentAction(formData: FormData) {
  const session = await requireDataEditAuth();
  const companyId = resolveCompanyId(
    session,
    parseOptionalCompanyId(formData),
  );
  const id = formData.get("id");
  await deleteDepartment(String(id ?? ""), companyId);
}
