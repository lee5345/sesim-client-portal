export function stripPhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function formatSeoulPhone(digits: string): string {
  const rest = digits.slice(2);

  if (rest.length <= 0) {
    return "02";
  }
  if (rest.length <= 3) {
    return `02-${rest}`;
  }
  if (digits.length <= 9) {
    return `02-${rest.slice(0, 3)}-${rest.slice(3)}`;
  }
  return `02-${rest.slice(0, 4)}-${rest.slice(4, 8)}`;
}

function formatNonSeoulPhone(digits: string): string {
  if (digits.length <= 3) {
    return digits;
  }
  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }
  if (digits.length <= 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
}

export function formatPhone(digits: string): string {
  const d = stripPhoneDigits(digits);
  if (!d) {
    return "";
  }
  if (d.startsWith("02")) {
    return formatSeoulPhone(d);
  }
  return formatNonSeoulPhone(d);
}

export function parsePhoneInput(value: string): string {
  const digits = stripPhoneDigits(value);
  if (digits.startsWith("02")) {
    return digits.slice(0, 10);
  }
  return digits.slice(0, 11);
}
