import { z } from "zod";

import { parseKstDueAt } from "@/lib/datetime/kst";
import { isValidDateString } from "@/lib/validation/date-string";
import { getFirstZodErrorMessage } from "@/lib/validation/zod-korean";

const dueDateSchema = z
  .string({ error: "마감일을 입력해 주세요." })
  .trim()
  .min(1, "마감일을 입력해 주세요.")
  .regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식은 YYYY-MM-DD여야 합니다.")
  .refine(isValidDateString, "올바른 날짜를 입력해 주세요.");

const optionalDueTimeSchema = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }
    return String(value).trim();
  },
  z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "시간 형식은 HH:mm이어야 합니다.")
    .optional(),
);

const optionalCompanyIdSchema = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) {
      return null;
    }
    return String(value).trim();
  },
  z.string().uuid("고객사 정보가 올바르지 않습니다.").nullable(),
);

function parseAssigneeIds(formData: FormData): string[] {
  const values = formData.getAll("assigneeIds");
  return values
    .map((value) => String(value).trim())
    .filter((value) => value.length > 0);
}

const officeTaskFieldsSchema = z.object({
  title: z
    .string({ error: "제목을 입력해 주세요." })
    .trim()
    .min(1, "제목을 입력해 주세요.")
    .max(200, "제목은 200자 이하여야 합니다."),
  description: z.preprocess(
    (value) => {
      if (value === "" || value === null || value === undefined) {
        return null;
      }
      return String(value).trim();
    },
    z.string().max(5000, "설명은 5000자 이하여야 합니다.").nullable(),
  ),
  dueDate: dueDateSchema,
  dueTime: optionalDueTimeSchema,
  companyId: optionalCompanyIdSchema,
  assigneeIds: z
    .array(z.string().uuid("담당자 정보가 올바르지 않습니다."))
    .default([]),
});

export type OfficeTaskFormInput = z.infer<typeof officeTaskFieldsSchema> & {
  dueAt: Date;
  hasDueTime: boolean;
};

function toOfficeTaskFormInput(
  parsed: z.infer<typeof officeTaskFieldsSchema>,
): OfficeTaskFormInput {
  const { dueAt, hasDueTime } = parseKstDueAt({
    dueDate: parsed.dueDate,
    dueTime: parsed.dueTime,
  });

  return {
    ...parsed,
    dueAt,
    hasDueTime,
  };
}

export function parseCreateOfficeTaskFormData(formData: FormData) {
  const parsed = officeTaskFieldsSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    dueDate: formData.get("dueDate"),
    dueTime: formData.get("dueTime"),
    companyId: formData.get("companyId"),
    assigneeIds: parseAssigneeIds(formData),
  });

  if (!parsed.success) {
    return {
      success: false as const,
      error: getFirstZodErrorMessage(parsed.error),
    };
  }

  return {
    success: true as const,
    data: toOfficeTaskFormInput(parsed.data),
  };
}

export function parseUpdateOfficeTaskFormData(formData: FormData) {
  const idParsed = z
    .object({
      id: z.string().uuid("업무 정보가 올바르지 않습니다."),
    })
    .safeParse({ id: formData.get("id") });

  if (!idParsed.success) {
    return {
      success: false as const,
      error: getFirstZodErrorMessage(idParsed.error),
    };
  }

  const parsed = parseCreateOfficeTaskFormData(formData);
  if (!parsed.success) {
    return parsed;
  }

  return {
    success: true as const,
    data: {
      id: idParsed.data.id,
      ...parsed.data,
    },
  };
}

export function parseOfficeTaskIdFormData(formData: FormData) {
  const parsed = z
    .object({
      id: z.string().uuid("업무 정보가 올바르지 않습니다."),
    })
    .safeParse({ id: formData.get("id") });

  if (!parsed.success) {
    return {
      success: false as const,
      error: getFirstZodErrorMessage(parsed.error),
    };
  }

  return {
    success: true as const,
    data: parsed.data,
  };
}
