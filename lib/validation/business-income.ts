import { z } from "zod";

import { normalizeRRN, salaryBasisSchema } from "@/lib/validation/hire-intake";
import { translateZodErrorMessage } from "@/lib/validation/zod-korean";
import type { SalaryBasis } from "@/lib/generated/prisma/client";

const RRN_REGEX = /^\d{6}-?\d{7}$/;

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

const notesSchema = z
  .string()
  .trim()
  .max(500, "비고는 500자 이하여야 합니다.")
  .optional()
  .transform((value) => (value ? value : undefined));

const businessIncomeCoreSchema = z.object({
  year: z.number({ error: "연도를 다시 확인해 주세요." }).int().min(2000).max(2100),
  month: z.number({ error: "월을 다시 확인해 주세요." }).int().min(1).max(12),
  name: z.string().trim().min(1, "이름을 입력해 주세요."),
  incomeAmount: z
    .number()
    .int("소득액은 정수로 입력해 주세요.")
    .min(0, "소득액은 0 이상이어야 합니다."),
  incomeBasis: salaryBasisSchema,
  notes: notesSchema,
});

export type BusinessIncomeCoreInput = z.infer<typeof businessIncomeCoreSchema>;
export type CreateBusinessIncomeInput = BusinessIncomeCoreInput & { rrn: string };
export type UpdateBusinessIncomeInput = BusinessIncomeCoreInput & { rrn?: string };

export type BusinessIncomeFormParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function firstZodErrorMessage(error: z.ZodError): string {
  const message = error.issues[0]?.message ?? "입력값을 확인해 주세요.";
  return translateZodErrorMessage(message);
}

function emptyToUndefined(value: FormDataEntryValue | null): string | undefined {
  const text = String(value ?? "").trim();
  return text ? text : undefined;
}

function parseIncomeAmount(formData: FormData): number | unknown {
  const text = emptyToUndefined(formData.get("incomeAmount"));
  if (text === undefined) {
    return undefined;
  }
  const normalized = text.replace(/,/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : text;
}

function parseBusinessIncomeFormData<T extends CreateBusinessIncomeInput | UpdateBusinessIncomeInput>(
  formData: FormData,
  year: number,
  month: number,
  rrnSchemaToUse: z.ZodType<string | undefined>,
): BusinessIncomeFormParseResult<T> {
  const fieldsResult = businessIncomeCoreSchema.safeParse({
    year,
    month,
    name: formData.get("name"),
    incomeAmount: parseIncomeAmount(formData),
    incomeBasis: emptyToUndefined(formData.get("incomeBasis")),
    notes: emptyToUndefined(formData.get("notes")),
  });

  if (!fieldsResult.success) {
    return { success: false, error: firstZodErrorMessage(fieldsResult.error) };
  }

  const rrnRaw = formData.get("rrn");
  const rrnResult = rrnSchemaToUse.safeParse(rrnRaw === null ? undefined : rrnRaw);
  if (!rrnResult.success) {
    return { success: false, error: firstZodErrorMessage(rrnResult.error) };
  }

  const data = {
    ...fieldsResult.data,
    ...(rrnResult.data !== undefined ? { rrn: rrnResult.data } : {}),
  } as T;

  return { success: true, data };
}

export function parseCreateBusinessIncomeFormData(input: {
  formData: FormData;
  year: number;
  month: number;
}): BusinessIncomeFormParseResult<CreateBusinessIncomeInput> {
  return parseBusinessIncomeFormData(
    input.formData,
    input.year,
    input.month,
    rrnSchema,
  );
}

export function parseUpdateBusinessIncomeFormData(input: {
  formData: FormData;
  year: number;
  month: number;
}): BusinessIncomeFormParseResult<UpdateBusinessIncomeInput> {
  return parseBusinessIncomeFormData(
    input.formData,
    input.year,
    input.month,
    optionalRrnSchema,
  );
}

export function toBusinessIncomeAuditPayload(data: BusinessIncomeCoreInput) {
  return {
    year: data.year,
    month: data.month,
    name: data.name,
    incomeAmount: data.incomeAmount,
    incomeBasis: data.incomeBasis,
    notes: data.notes ?? null,
  };
}

export { normalizeRRN };
