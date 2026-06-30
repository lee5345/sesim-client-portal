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
import { optionalBusinessNumberSchema } from "@/lib/validation/business-number";
import { stripPhoneDigits } from "@/lib/format/phone";
import { optionalWorkplaceManagementNumberSchema } from "@/lib/validation/workplace-management-number";
import { getFirstZodErrorMessage } from "@/lib/validation/zod-korean";
import { prisma } from "@/lib/db/db";
import { requireAuth } from "@/lib/auth/guards";
import { afterDataMutation } from "@/modules/realtime/post-mutation";

export type CompanyProfileFieldActionResult =
  | { success: true }
  | { success: false; error: string };

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

  if (field.type === "businessNumber") {
    return optionalBusinessNumberSchema.parse(value) ?? null;
  }

  if (field.type === "workplaceManagementNumber") {
    return optionalWorkplaceManagementNumberSchema.parse(value) ?? null;
  }

  if (field.type === "phone") {
    const digits = stripPhoneDigits(value);
    if (!digits) {
      return null;
    }
    z.string()
      .regex(/^\d{9,11}$/, "전화번호는 9~11자리 숫자로 입력해 주세요.")
      .parse(digits);
    return digits;
  }

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

export async function updateCompanyProfileFieldAction(
  formData: FormData,
): Promise<CompanyProfileFieldActionResult> {
  const session = await requireAuth(["FIRM_STAFF", "FIRM_ADMIN"]);

  const companyIdResult = z.string().uuid().safeParse(formData.get("companyId"));
  if (!companyIdResult.success) {
    return { success: false, error: getFirstZodErrorMessage(companyIdResult.error) };
  }

  const fieldResult = fieldKeySchema.safeParse(formData.get("field"));
  if (!fieldResult.success) {
    return { success: false, error: getFirstZodErrorMessage(fieldResult.error) };
  }

  let parsedValue: string | boolean | null;
  try {
    parsedValue = parseFieldValue(fieldResult.data, formData.get("value"));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: getFirstZodErrorMessage(error) };
    }
    throw error;
  }

  const companyId = companyIdResult.data;
  const field = fieldResult.data;

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

  await afterDataMutation({
    session,
    companyId,
    entityType: "COMPANY_PROFILE",
    entityId: companyId,
    action: "UPDATE",
  });

  revalidatePath("/firm/companies");
  revalidatePath(`/firm/companies/${companyId}`);
  revalidatePath(`/firm/companies/${companyId}/info`);
  revalidatePath("/firm/dashboard");
  revalidatePath("/client/settings");
  revalidatePath("/client", "layout");
  revalidatePath("/firm", "layout");
  return { success: true };
}
