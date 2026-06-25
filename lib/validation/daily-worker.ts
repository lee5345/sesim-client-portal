import { z } from "zod";

import {
  calculateAvgHoursPerDay,
  calculateDaysWorked,
  createEmptyDailyHours,
  parseDailyHoursInput,
  type DailyHoursInput,
} from "@/lib/daily-workers/calculations";
import { normalizeRRN, salaryBasisSchema } from "@/lib/validation/hire-intake";
import { translateZodErrorMessage } from "@/lib/validation/zod-korean";
import {
  DAILY_HOUR_FIELD_NAMES,
  getOccupationCode,
  isDailyWorkerOccupation,
  type DailyWorkerOccupationValue,
} from "@/modules/daily-workers/constants";
import type { DailyWorkerOccupation, SalaryBasis } from "@/lib/generated/prisma/client";

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

const yearSchema = z.coerce
  .number()
  .int("연도는 정수여야 합니다.")
  .min(2000, "연도를 확인해 주세요.")
  .max(2100, "연도를 확인해 주세요.");

const monthSchema = z.coerce
  .number()
  .int("월은 정수여야 합니다.")
  .min(1, "월을 확인해 주세요.")
  .max(12, "월을 확인해 주세요.");

const occupationSchema = z
  .string()
  .trim()
  .min(1, "직종을 선택해 주세요.")
  .refine(isDailyWorkerOccupation, "직종을 선택해 주세요.");

const dailyWorkerFieldsSchema = z.object({
  year: yearSchema,
  month: monthSchema,
  name: z.string().trim().min(1, "이름을 입력해 주세요."),
  occupation: occupationSchema,
  salaryBasis: salaryBasisSchema,
  totalWage: z.coerce
    .number()
    .int("임금총액은 정수로 입력해 주세요.")
    .positive("임금총액은 0보다 커야 합니다."),
});

export type DailyWorkerCoreInput = {
  year: number;
  month: number;
  name: string;
  occupation: DailyWorkerOccupation;
  occupationCode: string;
  hours: DailyHoursInput;
  daysWorked: number;
  avgHoursPerDay: number;
  salaryBasis: SalaryBasis;
  totalWage: number;
};

export type CreateDailyWorkerInput = DailyWorkerCoreInput & { rrn: string };
export type UpdateDailyWorkerInput = DailyWorkerCoreInput & { rrn?: string };

export type DailyWorkerFormParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function firstZodErrorMessage(error: z.ZodError): string {
  const message = error.issues[0]?.message ?? "입력값을 확인해 주세요.";
  return translateZodErrorMessage(message);
}

function parseHoursFromFormData(formData: FormData): DailyHoursInput {
  const hours = createEmptyDailyHours();

  for (const fieldName of DAILY_HOUR_FIELD_NAMES) {
    const raw = String(formData.get(fieldName) ?? "").trim();
    if (!raw) {
      continue;
    }

    if (!/^\d+(\.\d)?$/.test(raw)) {
      throw new Error("근로시간은 소수점 첫째 자리까지만 입력할 수 있습니다.");
    }

    const parsed = parseDailyHoursInput(raw);
    if (parsed === null) {
      throw new Error("근로시간을 확인해 주세요.");
    }

    hours[fieldName] = parsed;
  }

  return hours;
}

function buildDailyWorkerCoreInput(
  fields: z.infer<typeof dailyWorkerFieldsSchema>,
  hours: DailyHoursInput,
): DailyWorkerCoreInput {
  const occupation = fields.occupation as DailyWorkerOccupationValue;

  return {
    year: fields.year,
    month: fields.month,
    name: fields.name,
    occupation,
    occupationCode: getOccupationCode(occupation),
    hours,
    daysWorked: calculateDaysWorked(hours),
    avgHoursPerDay: calculateAvgHoursPerDay(hours),
    salaryBasis: fields.salaryBasis,
    totalWage: fields.totalWage,
  };
}

function parseDailyWorkerFormData<T extends CreateDailyWorkerInput | UpdateDailyWorkerInput>(
  formData: FormData,
  rrnSchemaToUse: z.ZodType<string | undefined>,
): DailyWorkerFormParseResult<T> {
  try {
    const hours = parseHoursFromFormData(formData);
    const fieldsResult = dailyWorkerFieldsSchema.safeParse({
      year: formData.get("year"),
      month: formData.get("month"),
      name: formData.get("name"),
      occupation: formData.get("occupation"),
      salaryBasis: formData.get("salaryBasis"),
      totalWage: formData.get("totalWage"),
    });

    if (!fieldsResult.success) {
      return { success: false, error: firstZodErrorMessage(fieldsResult.error) };
    }

    const rrnRaw = formData.get("rrn");
    const rrnResult = rrnSchemaToUse.safeParse(rrnRaw === null ? undefined : rrnRaw);
    if (!rrnResult.success) {
      return { success: false, error: firstZodErrorMessage(rrnResult.error) };
    }

    const core = buildDailyWorkerCoreInput(fieldsResult.data, hours);
    const data = {
      ...core,
      ...(rrnResult.data !== undefined ? { rrn: rrnResult.data } : {}),
    } as T;

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "입력값을 확인해 주세요.",
    };
  }
}

export function parseCreateDailyWorkerFormData(
  formData: FormData,
): DailyWorkerFormParseResult<CreateDailyWorkerInput> {
  return parseDailyWorkerFormData(formData, rrnSchema);
}

export function parseUpdateDailyWorkerFormData(
  formData: FormData,
): DailyWorkerFormParseResult<UpdateDailyWorkerInput> {
  return parseDailyWorkerFormData(
    formData,
    optionalRrnSchema,
  );
}

export function toDailyWorkerAuditPayload(data: DailyWorkerCoreInput) {
  return {
    year: data.year,
    month: data.month,
    name: data.name,
    occupation: data.occupation,
    occupationCode: data.occupationCode,
    daysWorked: data.daysWorked,
    avgHoursPerDay: data.avgHoursPerDay,
    salaryBasis: data.salaryBasis,
    totalWage: data.totalWage,
  };
}

export { normalizeRRN };
