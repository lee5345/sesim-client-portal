import {
  BUSINESS_NUMBER_SEGMENT_LENGTHS,
  joinBusinessNumberSegments,
  splitIntoSegments,
} from "@/lib/form/segmented-digits";

export function formatBusinessNumber(value: string | null | undefined) {
  if (!value?.trim()) {
    return null;
  }

  const segments = splitIntoSegments(value, [...BUSINESS_NUMBER_SEGMENT_LENGTHS]);
  const formatted = joinBusinessNumberSegments(
    segments[0] ?? "",
    segments[1] ?? "",
    segments[2] ?? "",
  );

  return formatted || null;
}

export function normalizeBusinessNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) {
    return "";
  }

  const segments = splitIntoSegments(digits, [...BUSINESS_NUMBER_SEGMENT_LENGTHS]);
  return joinBusinessNumberSegments(
    segments[0] ?? "",
    segments[1] ?? "",
    segments[2] ?? "",
  );
}
