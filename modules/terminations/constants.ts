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
