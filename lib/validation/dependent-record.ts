import { z } from "zod";

import { isValidDateString, parseDateString } from "@/lib/validation/date-string";
import { translateZodErrorMessage } from "@/lib/validation/zod-korean";

function requiredDateSchema(label: string) {
  return z
    .string({ error: `${label}을(를) 입력해 주세요.` })
    .trim()
    .min(1, `${label}을(를) 입력해 주세요.`)
    .regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식은 YYYY-MM-DD여야 합니다.")
    .refine(isValidDateString, "올바른 날짜를 입력해 주세요.")
    .transform(parseDateString);
}

const dependentRecordBaseSchema = z.object({
  employeeName: z.string().trim().min(1, "직원 이름을 입력해 주세요.").max(100),
  dependentName: z.string().trim().min(1, "피부양자 이름을 입력해 주세요.").max(100),
  relationship: z.string().trim().min(1, "관계를 입력해 주세요.").max(100),
  registrationRequestedDate: requiredDateSchema("등록 희망일"),
});

export const createDependentRecordSchema = dependentRecordBaseSchema;
export const updateDependentRecordSchema = dependentRecordBaseSchema;

export type CreateDependentRecordInput = z.infer<typeof createDependentRecordSchema>;
export type UpdateDependentRecordInput = z.infer<typeof updateDependentRecordSchema>;

export type DependentRecordFormParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function firstZodErrorMessage(error: z.ZodError): string {
  const message = error.issues[0]?.message ?? "입력값을 확인해 주세요.";
  return translateZodErrorMessage(message);
}

function parseDependentRecordFormData(formData: FormData) {
  return {
    employeeName: formData.get("employeeName"),
    dependentName: formData.get("dependentName"),
    relationship: formData.get("relationship"),
    registrationRequestedDate: formData.get("registrationRequestedDate"),
  };
}

export function parseCreateDependentRecordFormData(
  formData: FormData,
): DependentRecordFormParseResult<CreateDependentRecordInput> {
  const result = createDependentRecordSchema.safeParse(
    parseDependentRecordFormData(formData),
  );

  if (!result.success) {
    return { success: false, error: firstZodErrorMessage(result.error) };
  }

  return { success: true, data: result.data };
}

export function parseUpdateDependentRecordFormData(
  formData: FormData,
): DependentRecordFormParseResult<UpdateDependentRecordInput> {
  const result = updateDependentRecordSchema.safeParse(
    parseDependentRecordFormData(formData),
  );

  if (!result.success) {
    return { success: false, error: firstZodErrorMessage(result.error) };
  }

  return { success: true, data: result.data };
}

export function toDependentRecordAuditPayload(data: CreateDependentRecordInput) {
  return {
    employeeName: data.employeeName,
    dependentName: data.dependentName,
    relationship: data.relationship,
    registrationRequestedDate: data.registrationRequestedDate.toISOString(),
  };
}
