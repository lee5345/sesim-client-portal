"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  COMPANY_PROFILE_FIELD_KEYS,
  COMPANY_PROFILE_FIELD_MAP,
  type CompanyProfile,
  type CompanyProfileFieldKey,
} from "@/lib/companies/profile-fields";
import { prisma } from "@/lib/db/db";
import { requireAuth } from "@/lib/auth/guards";

const companyProfileSelect = {
  id: true,
  name: true,
  firmContactName: true,
  managesPayroll: true,
  managesFourMajorInsurance: true,
  businessNumber: true,
  workplaceManagementNumber: true,
  representativeName: true,
  companyContactName: true,
  companyContactTitle: true,
  phone: true,
  mobile: true,
  fax: true,
  email: true,
  businessAddress: true,
  taxOfficeName: true,
  taxOfficeContact: true,
  certificatePassword: true,
  workersCompPhone: true,
  workersCompFax: true,
  nhisPhone: true,
  nhisFax: true,
  npsPhone: true,
  npsFax: true,
  employmentCenterPhone: true,
  employmentCenterFax: true,
  retirementPensionContact: true,
  retirementPensionPhone: true,
  notes: true,
} as const;

const fieldKeySchema = z.enum(
  COMPANY_PROFILE_FIELD_KEYS as [CompanyProfileFieldKey, ...CompanyProfileFieldKey[]],
);

function parseFieldValue(key: CompanyProfileFieldKey, rawValue: FormDataEntryValue | null) {
  const field = COMPANY_PROFILE_FIELD_MAP.get(key);
  if (!field) {
    throw new Error("Invalid field");
  }

  const value = typeof rawValue === "string" ? rawValue.trim() : "";

  if (field.type === "boolean") {
    if (!value) return null;
    if (value === "true") return true;
    if (value === "false") return false;
    throw new Error("Invalid boolean value");
  }

  if (!value) return null;

  if (field.type === "email") {
    z.string().email("올바른 이메일 형식이 아닙니다.").parse(value);
  }

  if (field.key === "name") {
    z.string().min(1, "업체명을 입력해 주세요.").max(100).parse(value);
  } else if (field.maxLength) {
    z.string().max(field.maxLength).parse(value);
  }

  return value;
}

export async function getCompanyProfile(
  companyId: string,
): Promise<CompanyProfile | null> {
  return prisma.company.findFirst({
    where: { id: companyId, deletedAt: null },
    select: companyProfileSelect,
  });
}

export async function updateCompanyProfileFieldAction(formData: FormData) {
  await requireAuth(["FIRM_STAFF", "FIRM_ADMIN"]);

  const companyId = z.string().uuid().parse(formData.get("companyId"));
  const field = fieldKeySchema.parse(formData.get("field"));
  const parsedValue = parseFieldValue(field, formData.get("value"));

  const existing = await prisma.company.findFirst({
    where: { id: companyId, deletedAt: null },
    select: { id: true },
  });
  if (!existing) {
    redirect("/firm/companies");
  }

  await prisma.company.update({
    where: { id: companyId },
    data: { [field]: parsedValue },
  });

  revalidatePath("/firm/companies");
  revalidatePath(`/firm/companies/${companyId}`);
  revalidatePath(`/firm/companies/${companyId}/info`);
  revalidatePath("/firm/dashboard");
}
