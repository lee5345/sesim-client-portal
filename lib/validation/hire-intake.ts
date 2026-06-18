import { z } from "zod";

import { stripPhoneDigits } from "@/lib/format/phone";
import { NON_TAXABLE_ALLOWANCE_TYPES } from "@/modules/hire-intakes/constants";
import { isValidDateString, parseDateString } from "@/lib/validation/date-string";
import { translateZodErrorMessage } from "@/lib/validation/zod-korean";

const RRN_REGEX = /^\d{6}-?\d{7}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const salaryTypeSchema = z.enum(["ANNUAL", "MONTHLY", "DAILY", "HOURLY"], {
  error: "급여 유형을 선택해 주세요.",
});
export const salaryBasisSchema = z.enum(["GROSS", "NET"], {
  error: "급여 기준을 선택해 주세요.",
});

export const nonTaxableAllowanceTypeSchema = z.enum(NON_TAXABLE_ALLOWANCE_TYPES);

export const nonTaxableAllowanceSchema = z
  .object({
    type: nonTaxableAllowanceTypeSchema,
    customLabel: z.string().trim().optional(),
    amount: z
      .number({ error: "금액을 입력해 주세요." })
      .int("금액은 정수로 입력해 주세요.")
      .positive("금액은 0보다 커야 합니다."),
  })
  .superRefine((data, ctx) => {
    if (data.type === "기타" && !data.customLabel?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "기타 항목명을 입력해 주세요.",
        path: ["customLabel"],
      });
    }
  })
  .transform((data) => ({
    type: data.type,
    ...(data.type === "기타" && data.customLabel
      ? { customLabel: data.customLabel.trim() }
      : {}),
    amount: data.amount,
  }));

export type NonTaxableAllowance = z.infer<typeof nonTaxableAllowanceSchema>;

export function parseStoredNonTaxableAllowances(
  value: unknown,
): NonTaxableAllowance[] | null {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  const result = z.array(nonTaxableAllowanceSchema).safeParse(value);
  return result.success ? result.data : null;
}

const nonTaxableAllowancesSchema = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  },
  z.array(nonTaxableAllowanceSchema).optional(),
);

const bankNameSchema = z
  .string()
  .trim()
  .max(50, "은행명은 50자 이하여야 합니다.")
  .optional()
  .transform((value) => (value ? value : undefined));

const accountNumberSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined))
  .refine(
    (value) => value === undefined || /^\d+$/.test(value),
    "계좌번호는 숫자만 입력해 주세요.",
  );

const emailSchema = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }
    return String(value).trim();
  },
  z
    .string()
    .optional()
    .refine(
      (value) => value === undefined || EMAIL_REGEX.test(value),
      "올바른 이메일 형식이 아닙니다.",
    ),
);

const phoneSchema = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }
    const digits = stripPhoneDigits(String(value));
    return digits ? digits : undefined;
  },
  z
    .string()
    .optional()
    .refine(
      (value) => value === undefined || /^\d{10,11}$/.test(value),
      "연락처는 10~11자리 숫자로 입력해 주세요.",
    ),
);

const notesSchema = z
  .string()
  .trim()
  .max(500, "비고는 500자 이하여야 합니다.")
  .optional()
  .transform((value) => (value ? value : undefined));

const departmentSchema = z
  .string()
  .trim()
  .max(50, "부서명은 50자 이하여야 합니다.")
  .optional()
  .transform((value) => (value ? value : undefined));

const isContractSchema = z.preprocess(
  (value) => value === true || value === "true" || value === "on",
  z.boolean({ error: "고용 형태를 선택해 주세요." }),
);

function requiredDateSchema(label: string) {
  return z
    .string({ error: `${label}을(를) 입력해 주세요.` })
    .trim()
    .min(1, `${label}을(를) 입력해 주세요.`)
    .regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식은 YYYY-MM-DD여야 합니다.")
    .refine(isValidDateString, "올바른 날짜를 입력해 주세요.")
    .transform(parseDateString);
}

function optionalDateSchema() {
  return z.preprocess(
    (value) => {
      if (value === "" || value === null || value === undefined) {
        return undefined;
      }

      return String(value).trim();
    },
    z.union([
      z.undefined(),
      z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식은 YYYY-MM-DD여야 합니다.")
        .refine(isValidDateString, "올바른 날짜를 입력해 주세요.")
        .transform(parseDateString),
    ]),
  );
}

const hireIntakeBaseSchema = z.object({
  name: z.string().trim().min(1, "이름을 입력해 주세요."),
  email: emailSchema,
  hireDate: requiredDateSchema("입사일"),
  department: departmentSchema,
  salaryType: salaryTypeSchema,
  salaryBasis: salaryBasisSchema,
  salaryAmount: z.preprocess(
    (value) => {
      if (value === "" || value === null || value === undefined) {
        return undefined;
      }

      const normalized = String(value).replace(/,/g, "");
      return Number(normalized);
    },
    z
      .number({
        error: (issue) =>
          issue.input === undefined
            ? "급여를 입력해 주세요."
            : "급여는 숫자로 입력해 주세요.",
      })
      .int("급여는 정수로 입력해 주세요.")
      .positive("급여는 0보다 커야 합니다."),
  ),
  isContract: isContractSchema,
  contractStart: optionalDateSchema(),
  contractEnd: optionalDateSchema(),
  nonTaxableAllowances: nonTaxableAllowancesSchema,
  bankName: bankNameSchema,
  accountNumber: accountNumberSchema,
  phone: phoneSchema,
  notes: notesSchema,
});

const contractStartRefinement = {
  message: "계약 시작일을 입력해 주세요.",
  path: ["contractStart"],
};

const contractEndRefinement = {
  message: "계약 종료일을 입력해 주세요.",
  path: ["contractEnd"],
};

const rrnSchema = z
  .string()
  .trim()
  .min(1, "주민등록번호를 입력해 주세요.")
  .regex(RRN_REGEX, "주민등록번호 형식이 올바르지 않습니다.");

const optionalRrnSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined))
  .refine((value) => value === undefined || RRN_REGEX.test(value), {
    message: "주민등록번호 형식이 올바르지 않습니다.",
  });

export const createHireIntakeSchema = hireIntakeBaseSchema
  .extend({ rrn: rrnSchema })
  .refine(
    (data) => !data.isContract || data.contractStart !== undefined,
    contractStartRefinement,
  )
  .refine(
    (data) => !data.isContract || data.contractEnd !== undefined,
    contractEndRefinement,
  );

export const updateHireIntakeSchema = hireIntakeBaseSchema
  .extend({ rrn: optionalRrnSchema })
  .refine(
    (data) => !data.isContract || data.contractStart !== undefined,
    contractStartRefinement,
  )
  .refine(
    (data) => !data.isContract || data.contractEnd !== undefined,
    contractEndRefinement,
  );

export type CreateHireIntakeInput = z.infer<typeof createHireIntakeSchema>;
export type UpdateHireIntakeInput = z.infer<typeof updateHireIntakeSchema>;

export type HireIntakeFormParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function firstZodErrorMessage(error: z.ZodError): string {
  const message = error.issues[0]?.message ?? "입력값을 확인해 주세요.";
  return translateZodErrorMessage(message);
}

export function normalizeRRN(rrn: string): string {
  const digits = rrn.replace(/-/g, "");
  return `${digits.slice(0, 6)}-${digits.slice(6)}`;
}

function emptyToUndefined(value: FormDataEntryValue | null): string | undefined {
  const text = String(value ?? "").trim();
  return text ? text : undefined;
}

export function parseCreateHireIntakeFormData(
  formData: FormData,
): HireIntakeFormParseResult<CreateHireIntakeInput> {
  const result = createHireIntakeSchema.safeParse({
    name: formData.get("name"),
    email: emptyToUndefined(formData.get("email")),
    rrn: formData.get("rrn"),
    hireDate: formData.get("hireDate"),
    department: emptyToUndefined(formData.get("department")),
    salaryType: formData.get("salaryType"),
    salaryBasis: formData.get("salaryBasis"),
    salaryAmount: formData.get("salaryAmount"),
    isContract: formData.get("isContract"),
    contractStart: emptyToUndefined(formData.get("contractStart")),
    contractEnd: emptyToUndefined(formData.get("contractEnd")),
    nonTaxableAllowances: formData.get("nonTaxableAllowances"),
    bankName: emptyToUndefined(formData.get("bankName")),
    accountNumber: emptyToUndefined(formData.get("accountNumber")),
    phone: emptyToUndefined(formData.get("phone")),
    notes: emptyToUndefined(formData.get("notes")),
  });

  if (!result.success) {
    return { success: false, error: firstZodErrorMessage(result.error) };
  }

  return { success: true, data: result.data };
}

export function parseUpdateHireIntakeFormData(
  formData: FormData,
): HireIntakeFormParseResult<UpdateHireIntakeInput> {
  const result = updateHireIntakeSchema.safeParse({
    name: formData.get("name"),
    email: emptyToUndefined(formData.get("email")),
    rrn: emptyToUndefined(formData.get("rrn")),
    hireDate: formData.get("hireDate"),
    department: emptyToUndefined(formData.get("department")),
    salaryType: formData.get("salaryType"),
    salaryBasis: formData.get("salaryBasis"),
    salaryAmount: formData.get("salaryAmount"),
    isContract: formData.get("isContract"),
    contractStart: emptyToUndefined(formData.get("contractStart")),
    contractEnd: emptyToUndefined(formData.get("contractEnd")),
    nonTaxableAllowances: formData.get("nonTaxableAllowances"),
    bankName: emptyToUndefined(formData.get("bankName")),
    accountNumber: emptyToUndefined(formData.get("accountNumber")),
    phone: emptyToUndefined(formData.get("phone")),
    notes: emptyToUndefined(formData.get("notes")),
  });

  if (!result.success) {
    return { success: false, error: firstZodErrorMessage(result.error) };
  }

  return { success: true, data: result.data };
}

export function toAuditPayload(
  data: Omit<CreateHireIntakeInput, "rrn"> & {
    contractStart?: Date | null;
    contractEnd?: Date | null;
  },
) {
  return {
    name: data.name,
    email: data.email ?? null,
    hireDate: data.hireDate.toISOString(),
    department: data.department ?? null,
    salaryType: data.salaryType,
    salaryBasis: data.salaryBasis,
    salaryAmount: data.salaryAmount,
    isContract: data.isContract,
    contractStart: data.contractStart?.toISOString() ?? null,
    contractEnd: data.contractEnd?.toISOString() ?? null,
    nonTaxableAllowances: data.nonTaxableAllowances ?? null,
    bankName: data.bankName ?? null,
    accountNumber: data.accountNumber ?? null,
    phone: data.phone ?? null,
    notes: data.notes ?? null,
  };
}
