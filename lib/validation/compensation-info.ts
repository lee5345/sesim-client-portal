import { z } from "zod";

import { translateZodErrorMessage } from "@/lib/validation/zod-korean";

function emptyToUndefined(value: FormDataEntryValue | null): string | undefined {
  const text = String(value ?? "").trim();
  return text ? text : undefined;
}

function normalizeMinutes(minutes: number) {
  return Math.max(0, Math.min(59, minutes));
}

function hoursFromFormParts(
  hoursRaw: FormDataEntryValue | null,
  minutesRaw: FormDataEntryValue | null,
): number | undefined {
  const hoursText = emptyToUndefined(hoursRaw);
  const minutesText = emptyToUndefined(minutesRaw);

  if (hoursText === undefined && minutesText === undefined) {
    return undefined;
  }

  const hours = hoursText !== undefined ? Number(hoursText) : 0;
  const minutes = minutesText !== undefined ? Number(minutesText) : 0;

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return undefined;
  }

  const total = hours + normalizeMinutes(minutes) / 60;
  return Math.round(total * 100) / 100;
}

const notesSchema = z
  .string()
  .trim()
  .max(500, "비고는 500자 이하여야 합니다.")
  .optional()
  .transform((value) => (value ? value : undefined));

const unusedLeaveUnitSchema = z.enum(["DAYS", "HOURS"]).optional();

const unusedLeaveAmountSchema = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }
    const n = Number(String(value).trim());
    if (!Number.isFinite(n)) {
      return value;
    }
    return Math.round(n * 10) / 10;
  },
  z
    .number({ error: "미사용연차 값을 입력해 주세요." })
    .min(0, "미사용연차 값은 0 이상이어야 합니다."),
);

export const compensationInfoCoreSchema = z
  .object({
    year: z.number({ error: "연도를 다시 확인해 주세요." }).int().min(2000).max(2100),
    month: z.number({ error: "월을 다시 확인해 주세요." }).int().min(1).max(12),
    name: z.string().trim().min(1, "이름을 입력해 주세요."),
    overtimeHours: z.number().min(0).optional(),
    holidayHours: z.number().min(0).optional(),
    nightHours: z.number().min(0).optional(),
    absenceDays: z
      .number()
      .int("결근 일수는 정수로 입력해 주세요.")
      .min(0, "결근 일수는 0 이상이어야 합니다.")
      .optional(),
    lateEarlyLeaveHours: z.number().min(0).optional(),
    incentiveAmount: z
      .number()
      .int("인센티브 금액은 정수로 입력해 주세요.")
      .min(0, "인센티브 금액은 0 이상이어야 합니다.")
      .optional(),
    unusedLeaveUnit: unusedLeaveUnitSchema,
    unusedLeaveAmount: unusedLeaveAmountSchema.optional(),
    notes: notesSchema,
  })
  .superRefine((data, ctx) => {
    if (data.unusedLeaveAmount !== undefined && data.unusedLeaveUnit === undefined) {
      ctx.addIssue({
        code: "custom",
        message: "미사용연차 단위를 선택해 주세요.",
        path: ["unusedLeaveUnit"],
      });
    }
    if (data.unusedLeaveUnit !== undefined && data.unusedLeaveAmount === undefined) {
      ctx.addIssue({
        code: "custom",
        message: "미사용연차 값을 입력해 주세요.",
        path: ["unusedLeaveAmount"],
      });
    }
  });

export type CompensationInfoCoreInput = z.infer<typeof compensationInfoCoreSchema>;

export type CompensationInfoFormParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function firstZodErrorMessage(error: z.ZodError): string {
  const message = error.issues[0]?.message ?? "입력값을 확인해 주세요.";
  return translateZodErrorMessage(message);
}

export function parseCompensationInfoFormData(input: {
  formData: FormData;
  year: number;
  month: number;
}): CompensationInfoFormParseResult<CompensationInfoCoreInput> {
  const { formData } = input;

  const overtime = hoursFromFormParts(
    formData.get("overtimeHoursHours"),
    formData.get("overtimeHoursMinutes"),
  );
  const holiday = hoursFromFormParts(
    formData.get("holidayHoursHours"),
    formData.get("holidayHoursMinutes"),
  );
  const night = hoursFromFormParts(
    formData.get("nightHoursHours"),
    formData.get("nightHoursMinutes"),
  );
  const late = hoursFromFormParts(
    formData.get("lateEarlyLeaveHoursHours"),
    formData.get("lateEarlyLeaveHoursMinutes"),
  );

  const result = compensationInfoCoreSchema.safeParse({
    year: input.year,
    month: input.month,
    name: formData.get("name"),
    overtimeHours: overtime === undefined ? undefined : overtime,
    holidayHours: holiday === undefined ? undefined : holiday,
    nightHours: night === undefined ? undefined : night,
    absenceDays: (() => {
      const text = emptyToUndefined(formData.get("absenceDays"));
      if (text === undefined) return undefined;
      const n = Number(text);
      return Number.isFinite(n) ? n : (text as unknown);
    })(),
    lateEarlyLeaveHours: late === undefined ? undefined : late,
    incentiveAmount: (() => {
      const text = emptyToUndefined(formData.get("incentiveAmount"));
      if (text === undefined) return undefined;
      const normalized = text.replace(/,/g, "");
      const n = Number(normalized);
      return Number.isFinite(n) ? n : (text as unknown);
    })(),
    unusedLeaveUnit: emptyToUndefined(formData.get("unusedLeaveUnit")),
    unusedLeaveAmount: emptyToUndefined(formData.get("unusedLeaveAmount")),
    notes: emptyToUndefined(formData.get("notes")),
  });

  if (!result.success) {
    return { success: false, error: firstZodErrorMessage(result.error) };
  }

  return { success: true, data: result.data };
}

export function toCompensationInfoAuditPayload(data: CompensationInfoCoreInput) {
  return {
    year: data.year,
    month: data.month,
    name: data.name,
    overtimeHours: data.overtimeHours ?? null,
    holidayHours: data.holidayHours ?? null,
    nightHours: data.nightHours ?? null,
    absenceDays: data.absenceDays ?? null,
    lateEarlyLeaveHours: data.lateEarlyLeaveHours ?? null,
    incentiveAmount: data.incentiveAmount ?? null,
    unusedLeaveUnit: data.unusedLeaveUnit ?? null,
    unusedLeaveAmount: data.unusedLeaveAmount ?? null,
    notes: data.notes ?? null,
  };
}

