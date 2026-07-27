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
import { decryptRRN, encryptRRN, maskRRN } from "@/lib/encryption/rrn";
import { optionalBusinessNumberSchema } from "@/lib/validation/business-number";
import { stripPhoneDigits } from "@/lib/format/phone";
import { normalizeRRN } from "@/lib/validation/hire-intake";
import { optionalWorkplaceManagementNumberSchema } from "@/lib/validation/workplace-management-number";
import { getFirstZodErrorMessage } from "@/lib/validation/zod-korean";
import { prisma } from "@/lib/db/db";
import { requireAuth } from "@/lib/auth/guards";
import { bumpSyncCursors } from "@/modules/realtime/sync";

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
  representativeRrnEncrypted: true,
  representativeRrnIv: true,
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

const RRN_REGEX = /^\d{6}-?\d{7}$/;

function toCompanyProfile(
  company: {
    id: string;
    name: string;
    firmContactName: string | null;
    managesPayroll: boolean | null;
    managesFourMajorInsurance: boolean | null;
    businessNumber: string | null;
    workplaceManagementNumber: string | null;
    representativeName: string | null;
    representativeRrnEncrypted: string | null;
    representativeRrnIv: string | null;
    companyContactName: string | null;
    companyContactTitle: string | null;
    phone: string | null;
    mobile: string | null;
    fax: string | null;
    email: string | null;
    businessAddress: string | null;
    taxOfficeName: string | null;
    taxOfficeContact: string | null;
    certificatePassword: string | null;
    workersCompPhone: string | null;
    workersCompFax: string | null;
    nhisPhone: string | null;
    nhisFax: string | null;
    npsPhone: string | null;
    npsFax: string | null;
    employmentCenterPhone: string | null;
    employmentCenterFax: string | null;
    retirementPensionContact: string | null;
    retirementPensionPhone: string | null;
    notes: string | null;
  },
): CompanyProfile {
  const {
    representativeRrnEncrypted,
    representativeRrnIv,
    ...rest
  } = company;

  let maskedRepresentativeRrn: string | null = null;
  if (representativeRrnEncrypted && representativeRrnIv) {
    try {
      maskedRepresentativeRrn = maskRRN(
        decryptRRN(representativeRrnEncrypted, representativeRrnIv),
      );
    } catch {
      maskedRepresentativeRrn = "******-*******";
    }
  }

  return {
    ...rest,
    maskedRepresentativeRrn,
  };
}

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

  if (field.type === "rrn") {
    z.string()
      .regex(RRN_REGEX, "주민등록번호 형식이 올바르지 않습니다.")
      .parse(value);
    return normalizeRRN(value);
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
  const company = await prisma.company.findFirst({
    where: { id: companyId, deletedAt: null },
    select: companyProfileSelect,
  });

  if (!company) {
    return null;
  }

  return toCompanyProfile(company);
}

export async function updateCompanyProfileFieldAction(
  formData: FormData,
): Promise<CompanyProfileFieldActionResult> {
  await requireAuth(["FIRM_STAFF", "FIRM_ADMIN"]);

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

  if (field === "representativeRrn") {
    if (parsedValue === null) {
      await prisma.company.update({
        where: { id: companyId },
        data: {
          representativeRrnEncrypted: null,
          representativeRrnIv: null,
        },
      });
    } else {
      const { encrypted, iv } = encryptRRN(parsedValue as string);
      await prisma.company.update({
        where: { id: companyId },
        data: {
          representativeRrnEncrypted: encrypted,
          representativeRrnIv: iv,
        },
      });
    }
  } else {
    await prisma.company.update({
      where: { id: companyId },
      data: { [field]: parsedValue },
    });
  }

  await bumpSyncCursors(companyId);

  revalidatePath("/firm/companies");
  revalidatePath(`/firm/companies/${companyId}`);
  revalidatePath(`/firm/companies/${companyId}/info`);
  revalidatePath("/firm/dashboard");
  revalidatePath("/client/settings");
  revalidatePath("/client", "layout");
  revalidatePath("/firm", "layout");
  return { success: true };
}

export async function revealCompanyRepresentativeRrn(companyId: string) {
  await requireAuth(["FIRM_STAFF", "FIRM_ADMIN"]);

  const company = await prisma.company.findFirst({
    where: { id: companyId, deletedAt: null },
    select: {
      representativeRrnEncrypted: true,
      representativeRrnIv: true,
    },
  });

  if (!company?.representativeRrnEncrypted || !company.representativeRrnIv) {
    throw new Error("Representative RRN not found");
  }

  return {
    rrn: decryptRRN(
      company.representativeRrnEncrypted,
      company.representativeRrnIv,
    ),
  };
}
