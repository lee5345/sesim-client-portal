export function formatSalaryAmount(amount: number) {
  return `${amount.toLocaleString("ko-KR")}원`;
}

export function formatSalaryInput(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) {
    return "";
  }

  return Number(digits).toLocaleString("ko-KR");
}

export function parseSalaryInput(value: string) {
  return value.replace(/\D/g, "");
}
