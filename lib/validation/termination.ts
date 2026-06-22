import { z } from "zod";

import { isValidDateString, parseDateString } from "@/lib/validation/date-string";
import { normalizeRRN } from "@/lib/validation/hire-intake";
import { translateZodErrorMessage } from "@/lib/validation/zod-korean";
import {
  TERMINATION_REASON_CUSTOM_VALUE,
  isTerminationReasonPreset,
} from "@/modules/terminations/constants";

const RRN_REGEX = /^\d{6}-?\d{7}$/;

function requiredDateSchema(label: string) {
  return z
    .string({ error: `${label}을(를) 입력해 주세요.` })
    .trim()
    .min(1, `${label}을(를) 입력해 주세요.`)
    .regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식은 YYYY-MM-DD여야 합니다.")
    .refine(isValidDateString, "올바른 날짜를 입력해 주세요.")
    .transform(parseDateString);
}

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

const terminationReasonInputSchema = z.object({
  name: z.string().trim().min(1, "이름을 입력해 주세요."),
  terminationDate: requiredDateSchema("퇴사일"),
  reasonPreset: z
    .string({ error: "퇴사 사유를 선택해 주세요." })
    .trim()
    .min(1, "퇴사 사유를 선택해 주세요."),
  reasonCustom: z
    .string()
    .trim()
    .max(200, "퇴사 사유는 200자 이하여야 합니다.")
    .optional()
    .transform((value) => (value ? value : undefined)),
});

function refineTerminationReason(
  data: z.infer<typeof terminationReasonInputSchema>,
  ctx: z.RefinementCtx,
) {
  if (
    !isTerminationReasonPreset(data.reasonPreset) &&
    data.reasonPreset !== TERMINATION_REASON_CUSTOM_VALUE
  ) {
    ctx.addIssue({
      code: "custom",
      message: "퇴사 사유를 선택해 주세요.",
      path: ["reasonPreset"],
    });
    return;
  }

  if (data.reasonPreset === TERMINATION_REASON_CUSTOM_VALUE && !data.reasonCustom) {
    ctx.addIssue({
      code: "custom",
      message: "퇴사 사유를 입력해 주세요.",
      path: ["reasonCustom"],
    });
  }
}

function resolveTerminationReason(
  data: z.infer<typeof terminationReasonInputSchema>,
) {
  return {
    name: data.name,
    terminationDate: data.terminationDate,
    reason:
      data.reasonPreset === TERMINATION_REASON_CUSTOM_VALUE
        ? data.reasonCustom!
        : data.reasonPreset,
  };
}

export const createTerminationSchema = terminationReasonInputSchema
  .extend({ rrn: rrnSchema })
  .superRefine(refineTerminationReason)
  .transform((data) => ({
    ...resolveTerminationReason(data),
    rrn: data.rrn,
  }));

export const updateTerminationSchema = terminationReasonInputSchema
  .extend({ rrn: optionalRrnSchema })
  .superRefine(refineTerminationReason)
  .transform((data) => ({
    ...resolveTerminationReason(data),
    rrn: data.rrn,
  }));

export type CreateTerminationInput = z.infer<typeof createTerminationSchema>;
export type UpdateTerminationInput = z.infer<typeof updateTerminationSchema>;

export type TerminationFormParseResult<T> =
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

export function parseCreateTerminationFormData(
  formData: FormData,
): TerminationFormParseResult<CreateTerminationInput> {
  const result = createTerminationSchema.safeParse({
    name: formData.get("name"),
    rrn: formData.get("rrn"),
    terminationDate: formData.get("terminationDate"),
    reasonPreset: formData.get("reasonPreset"),
    reasonCustom: emptyToUndefined(formData.get("reasonCustom")),
  });

  if (!result.success) {
    return { success: false, error: firstZodErrorMessage(result.error) };
  }

  return { success: true, data: result.data };
}

export function parseUpdateTerminationFormData(
  formData: FormData,
): TerminationFormParseResult<UpdateTerminationInput> {
  const result = updateTerminationSchema.safeParse({
    name: formData.get("name"),
    rrn: emptyToUndefined(formData.get("rrn")),
    terminationDate: formData.get("terminationDate"),
    reasonPreset: formData.get("reasonPreset"),
    reasonCustom: emptyToUndefined(formData.get("reasonCustom")),
  });

  if (!result.success) {
    return { success: false, error: firstZodErrorMessage(result.error) };
  }

  return { success: true, data: result.data };
}

export function toTerminationAuditPayload(
  data: Omit<CreateTerminationInput, "rrn">,
) {
  return {
    name: data.name,
    terminationDate: data.terminationDate.toISOString(),
    reason: data.reason,
  };
}

export { normalizeRRN };
