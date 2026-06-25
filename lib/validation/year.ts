export function isValidFourDigitYear(value: string): boolean {
  return /^\d{4}$/.test(value.trim());
}

export function parseFourDigitYear(value: string): number | null {
  const trimmed = value.trim();
  if (!isValidFourDigitYear(trimmed)) {
    return null;
  }

  const year = Number(trimmed);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return null;
  }

  return year;
}

