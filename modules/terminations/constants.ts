import type { RetirementPayType } from "@/lib/generated/prisma/client";

export const RETIREMENT_PAY_TYPE_OPTIONS = [
  { value: "NOT_APPLICABLE", label: "비대상" },
  { value: "SEVERANCE_PAY", label: "퇴직금" },
  { value: "SEVERANCE_PENSION", label: "퇴직연금" },
] as const satisfies ReadonlyArray<{
  value: RetirementPayType;
  label: string;
}>;

export const RETIREMENT_PAY_TYPE_LABELS: Record<RetirementPayType, string> = {
  NOT_APPLICABLE: "비대상",
  SEVERANCE_PAY: "퇴직금",
  SEVERANCE_PENSION: "퇴직연금",
};

export function isRetirementPayType(value: string): value is RetirementPayType {
  return (RETIREMENT_PAY_TYPE_OPTIONS as readonly { value: string }[]).some(
    (option) => option.value === value,
  );
}

export const TERMINATION_REASON_PRESETS = [
  "개인사정",
  "권고사직",
  "계약만료",
  "해고",
] as const;

export type TerminationReasonPreset =
  (typeof TERMINATION_REASON_PRESETS)[number];

export const TERMINATION_REASON_CUSTOM_VALUE = "__custom__";

export function getReasonFormValues(storedReason: string | null | undefined): {
  reasonPreset: string;
  reasonCustom: string;
} {
  if (!storedReason?.trim()) {
    return { reasonPreset: "", reasonCustom: "" };
  }

  if (
    (TERMINATION_REASON_PRESETS as readonly string[]).includes(storedReason)
  ) {
    return { reasonPreset: storedReason, reasonCustom: "" };
  }

  return {
    reasonPreset: TERMINATION_REASON_CUSTOM_VALUE,
    reasonCustom: storedReason,
  };
}

export function isTerminationReasonPreset(
  value: string,
): value is TerminationReasonPreset {
  return (TERMINATION_REASON_PRESETS as readonly string[]).includes(value);
}
