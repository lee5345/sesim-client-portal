import { z } from "zod";

import { isValidDateString, parseDateString } from "@/lib/validation/date-string";
import { translateZodErrorMessage } from "@/lib/validation/zod-korean";
import {
  requiresChildInfo,
  requiresExpectedDeliveryDate,
  requiresHourReduction,
} from "@/modules/leave-records/constants";

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

function optionalDateSchema(label: string) {
  return z.preprocess(
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
        (value) => value === undefined || /^\d{4}-\d{2}-\d{2}$/.test(value),
        "날짜 형식은 YYYY-MM-DD여야 합니다.",
      )
      .refine(
        (value) => value === undefined || isValidDateString(value),
        "올바른 날짜를 입력해 주세요.",
      )
      .transform((value) => (value ? parseDateString(value) : undefined)),
  );
}

const optionalWholeHoursSchema = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }
    return Number(String(value).replace(/,/g, ""));
  },
  z
    .number({ error: "근로시간은 숫자로 입력해 주세요." })
    .int("근로시간은 정수로 입력해 주세요.")
    .positive("근로시간은 0보다 커야 합니다.")
    .optional(),
);

const leaveTypeSchema = z.enum(
  [
    "MATERNITY_LEAVE",
    "SPOUSE_MATERNITY_LEAVE",
    "PRENATAL_PARENTAL_LEAVE",
    "GENERAL_PARENTAL_LEAVE",
    "CHILD_CARE_WORK_HOUR_REDUCTION",
    "PREGNANCY_WORK_HOUR_REDUCTION",
  ],
  { error: "종류를 선택해 주세요." },
);

const leaveRecordBaseSchema = z.object({
  name: z.string().trim().min(1, "이름을 입력해 주세요.").max(100),
  leaveType: leaveTypeSchema,
  periodStart: requiredDateSchema("기간 시작일"),
  periodEnd: requiredDateSchema("기간 종료일"),
  expectedDeliveryDate: optionalDateSchema("출산(예정)일"),
  childName: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((value) => (value ? value : undefined)),
  childRrn: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
  hoursBeforeReduction: optionalWholeHoursSchema,
  hoursAfterReduction: optionalWholeHoursSchema,
});

function refineLeaveRecord(options: { requireChildRrn: boolean }) {
  return leaveRecordBaseSchema.superRefine((data, ctx) => {
    if (data.periodEnd < data.periodStart) {
      ctx.addIssue({
        code: "custom",
        message: "기간 종료일은 시작일 이후여야 합니다.",
        path: ["periodEnd"],
      });
    }

    if (requiresExpectedDeliveryDate(data.leaveType) && !data.expectedDeliveryDate) {
      ctx.addIssue({
        code: "custom",
        message: "출산(예정)일을 입력해 주세요.",
        path: ["expectedDeliveryDate"],
      });
    }

    if (requiresChildInfo(data.leaveType)) {
      if (!data.childName) {
        ctx.addIssue({
          code: "custom",
          message: "대상자녀 이름을 입력해 주세요.",
          path: ["childName"],
        });
      }

      if (options.requireChildRrn) {
        if (!data.childRrn) {
          ctx.addIssue({
            code: "custom",
            message: "대상자녀 주민번호를 입력해 주세요.",
            path: ["childRrn"],
          });
        } else if (!RRN_REGEX.test(data.childRrn)) {
          ctx.addIssue({
            code: "custom",
            message: "올바른 주민번호 형식을 입력해 주세요.",
            path: ["childRrn"],
          });
        }
      } else if (data.childRrn && !RRN_REGEX.test(data.childRrn)) {
        ctx.addIssue({
          code: "custom",
          message: "올바른 주민번호 형식을 입력해 주세요.",
          path: ["childRrn"],
        });
      }
    }

    if (requiresHourReduction(data.leaveType)) {
      if (data.hoursBeforeReduction === undefined) {
        ctx.addIssue({
          code: "custom",
          message: "단축 전 근로시간을 입력해 주세요.",
          path: ["hoursBeforeReduction"],
        });
      }

      if (data.hoursAfterReduction === undefined) {
        ctx.addIssue({
          code: "custom",
          message: "단축 후 근로시간을 입력해 주세요.",
          path: ["hoursAfterReduction"],
        });
      }
    }
  });
}

export const createLeaveRecordSchema = refineLeaveRecord({
  requireChildRrn: true,
});
export const updateLeaveRecordSchema = refineLeaveRecord({
  requireChildRrn: false,
});

export type CreateLeaveRecordInput = z.infer<typeof createLeaveRecordSchema>;
export type UpdateLeaveRecordInput = z.infer<typeof updateLeaveRecordSchema>;

export type LeaveRecordFormParseResult<T> =
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

function parseLeaveRecordFormData(formData: FormData) {
  return {
    name: formData.get("name"),
    leaveType: formData.get("leaveType"),
    periodStart: formData.get("periodStart"),
    periodEnd: formData.get("periodEnd"),
    expectedDeliveryDate: formData.get("expectedDeliveryDate"),
    childName: emptyToUndefined(formData.get("childName")),
    childRrn: emptyToUndefined(formData.get("childRrn")),
    hoursBeforeReduction: formData.get("hoursBeforeReduction"),
    hoursAfterReduction: formData.get("hoursAfterReduction"),
  };
}

export function parseCreateLeaveRecordFormData(
  formData: FormData,
): LeaveRecordFormParseResult<CreateLeaveRecordInput> {
  const result = createLeaveRecordSchema.safeParse(parseLeaveRecordFormData(formData));

  if (!result.success) {
    return { success: false, error: firstZodErrorMessage(result.error) };
  }

  return { success: true, data: result.data };
}

export function parseUpdateLeaveRecordFormData(
  formData: FormData,
): LeaveRecordFormParseResult<UpdateLeaveRecordInput> {
  const result = updateLeaveRecordSchema.safeParse(parseLeaveRecordFormData(formData));

  if (!result.success) {
    return { success: false, error: firstZodErrorMessage(result.error) };
  }

  return { success: true, data: result.data };
}

export function normalizeRRN(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 13) {
    return value.trim();
  }
  return `${digits.slice(0, 6)}-${digits.slice(6)}`;
}

export function toLeaveRecordAuditPayload(
  data: CreateLeaveRecordInput,
) {
  return {
    name: data.name,
    leaveType: data.leaveType,
    periodStart: data.periodStart.toISOString(),
    periodEnd: data.periodEnd.toISOString(),
    expectedDeliveryDate: data.expectedDeliveryDate?.toISOString() ?? null,
    childName: data.childName ?? null,
    hoursBeforeReduction: data.hoursBeforeReduction ?? null,
    hoursAfterReduction: data.hoursAfterReduction ?? null,
  };
}
