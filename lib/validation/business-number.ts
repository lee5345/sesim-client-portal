import { z } from "zod";

import { normalizeBusinessNumber } from "@/lib/format/business-number";

const BUSINESS_NUMBER_REGEX = /^\d{3}-\d{2}-\d{5}$/;

export const optionalBusinessNumberSchema = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }

    const text = String(value).trim();
    if (!text) {
      return undefined;
    }

    const normalized = normalizeBusinessNumber(text);
    const digits = normalized.replace(/\D/g, "");

    if (digits.length !== 10) {
      return text;
    }

    return normalized;
  },
  z
    .string()
    .optional()
    .refine(
      (value) => value === undefined || BUSINESS_NUMBER_REGEX.test(value),
      "사업자등록번호는 10자리로 입력해 주세요.",
    )
    .transform((value) => (value ? value : undefined)),
);
