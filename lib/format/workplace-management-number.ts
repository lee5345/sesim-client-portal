import {
  WORKPLACE_MANAGEMENT_NUMBER_SEGMENT_LENGTHS,
  joinWorkplaceManagementNumberSegments,
  splitIntoSegments,
} from "@/lib/form/segmented-digits";

export function formatWorkplaceManagementNumber(
  value: string | null | undefined,
) {
  if (!value?.trim()) {
    return null;
  }

  const segments = splitIntoSegments(value, [
    ...WORKPLACE_MANAGEMENT_NUMBER_SEGMENT_LENGTHS,
  ]);
  const formatted = joinWorkplaceManagementNumberSegments(
    segments[0] ?? "",
    segments[1] ?? "",
    segments[2] ?? "",
    segments[3] ?? "",
  );

  return formatted || null;
}

export function normalizeWorkplaceManagementNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) {
    return "";
  }

  const segments = splitIntoSegments(digits, [
    ...WORKPLACE_MANAGEMENT_NUMBER_SEGMENT_LENGTHS,
  ]);
  return joinWorkplaceManagementNumberSegments(
    segments[0] ?? "",
    segments[1] ?? "",
    segments[2] ?? "",
    segments[3] ?? "",
  );
}
