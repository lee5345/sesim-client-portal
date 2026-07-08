import { z } from "zod";

import { isValidDateString, parseDateString } from "@/lib/validation/date-string";
import { translateZodErrorMessage } from "@/lib/validation/zod-korean";
import { salaryBasisSchema, salaryTypeSchema } from "@/lib/validation/hire-intake";

function requiredDateSchema(label: string) {
  return z
    .string({ error: `${label}을(를) 입력해 주세요.` })
    .trim()
    .min(1, `${label}을(를) 입력해 주세요.`)
    .regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식은 YYYY-MM-DD여야 합니다.")
    .refine(isValidDateString, "올바른 날짜를 입력해 주세요.")
    .transform(parseDateString);
}

const salaryAmountSchema = z.preprocess(
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
        issue.input === undefined ? "급여를 입력해 주세요." : "급여는 숫자로 입력해 주세요.",
    })
    .int("급여는 정수로 입력해 주세요.")
    .positive("급여는 0보다 커야 합니다."),
);

const notesSchema = z
  .string()
  .trim()
  .max(500, "비고는 500자 이하여야 합니다.")
  .optional()
  .transform((value) => (value ? value : undefined));

const compChangeBaseSchema = z.object({
  name: z.string().trim().min(1, "이름을 입력해 주세요."),
  changeDate: requiredDateSchema("급여변경일"),
  salaryTypeBefore: salaryTypeSchema,
  salaryBasisBefore: salaryBasisSchema,
  salaryAmountBefore: salaryAmountSchema,
  salaryTypeAfter: salaryTypeSchema,
  salaryBasisAfter: salaryBasisSchema,
  salaryAmountAfter: salaryAmountSchema,
  notes: notesSchema,
});

export const createCompensationChangeSchema = compChangeBaseSchema;
export const updateCompensationChangeSchema = compChangeBaseSchema;

export type CreateCompensationChangeInput = z.infer<
  typeof createCompensationChangeSchema
>;
export type UpdateCompensationChangeInput = z.infer<
  typeof updateCompensationChangeSchema
>;

export type CompensationChangeFormParseResult<T> =
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

export function parseCreateCompensationChangeFormData(
  formData: FormData,
): CompensationChangeFormParseResult<CreateCompensationChangeInput> {
  const result = createCompensationChangeSchema.safeParse({
    name: formData.get("name"),
    changeDate: formData.get("changeDate"),
    salaryTypeBefore: formData.get("salaryTypeBefore"),
    salaryBasisBefore: formData.get("salaryBasisBefore"),
    salaryAmountBefore: formData.get("salaryAmountBefore"),
    salaryTypeAfter: formData.get("salaryTypeAfter"),
    salaryBasisAfter: formData.get("salaryBasisAfter"),
    salaryAmountAfter: formData.get("salaryAmountAfter"),
    notes: emptyToUndefined(formData.get("notes")),
  });

  if (!result.success) {
    return { success: false, error: firstZodErrorMessage(result.error) };
  }

  return { success: true, data: result.data };
}

export function parseUpdateCompensationChangeFormData(
  formData: FormData,
): CompensationChangeFormParseResult<UpdateCompensationChangeInput> {
  const result = updateCompensationChangeSchema.safeParse({
    name: formData.get("name"),
    changeDate: formData.get("changeDate"),
    salaryTypeBefore: formData.get("salaryTypeBefore"),
    salaryBasisBefore: formData.get("salaryBasisBefore"),
    salaryAmountBefore: formData.get("salaryAmountBefore"),
    salaryTypeAfter: formData.get("salaryTypeAfter"),
    salaryBasisAfter: formData.get("salaryBasisAfter"),
    salaryAmountAfter: formData.get("salaryAmountAfter"),
    notes: emptyToUndefined(formData.get("notes")),
  });

  if (!result.success) {
    return { success: false, error: firstZodErrorMessage(result.error) };
  }

  return { success: true, data: result.data };
}

export function toCompensationChangeAuditPayload(
  data: CreateCompensationChangeInput,
) {
  return {
    name: data.name,
    changeDate: data.changeDate.toISOString(),
    salaryTypeBefore: data.salaryTypeBefore,
    salaryBasisBefore: data.salaryBasisBefore,
    salaryAmountBefore: data.salaryAmountBefore,
    salaryTypeAfter: data.salaryTypeAfter,
    salaryBasisAfter: data.salaryBasisAfter,
    salaryAmountAfter: data.salaryAmountAfter,
    notes: data.notes ?? null,
  };
}

