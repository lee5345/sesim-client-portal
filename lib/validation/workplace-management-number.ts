import { z } from "zod";

import { normalizeWorkplaceManagementNumber } from "@/lib/format/workplace-management-number";

const WORKPLACE_MANAGEMENT_NUMBER_REGEX = /^\d{3}-\d{2}-\d{5}-\d$/;

export const optionalWorkplaceManagementNumberSchema = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }

    const text = String(value).trim();
    if (!text) {
      return undefined;
    }

    const normalized = normalizeWorkplaceManagementNumber(text);
    const digits = normalized.replace(/\D/g, "");

    if (digits.length !== 11) {
      return text;
    }

    return normalized;
  },
  z
    .string()
    .optional()
    .refine(
      (value) =>
        value === undefined || WORKPLACE_MANAGEMENT_NUMBER_REGEX.test(value),
      "사업장관리번호는 11자리로 입력해 주세요.",
    )
    .transform((value) => (value ? value : undefined)),
);
