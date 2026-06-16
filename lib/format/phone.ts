export function stripPhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatPhone(digits: string): string {
  const d = stripPhoneDigits(digits);
  if (!d) {
    return "";
  }
  if (d.length <= 3) {
    return d;
  }
  if (d.length <= 6) {
    return `${d.slice(0, 3)}-${d.slice(3)}`;
  }
  if (d.length <= 10) {
    return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  }
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`;
}

export function parsePhoneInput(value: string): string {
  return stripPhoneDigits(value).slice(0, 11);
}
