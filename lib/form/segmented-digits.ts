export function splitIntoSegments(value: string, lengths: number[]): string[] {
  const digits = value.replace(/\D/g, "");
  let offset = 0;

  return lengths.map((length) => {
    const segment = digits.slice(offset, offset + length);
    offset += length;
    return segment;
  });
}

export function joinSegments(values: string[], separator = ""): string {
  if (separator) {
    return values.some((segment) => segment.length > 0)
      ? values.join(separator)
      : "";
  }

  return values.join("");
}

export const RRN_SEGMENT_LENGTHS = [6, 7] as const;
export const PHONE_SEGMENT_LENGTHS = [3, 4, 4] as const;

export function joinRrnSegments(front: string, back: string): string {
  if (!front && !back) {
    return "";
  }

  return `${front}-${back}`;
}
