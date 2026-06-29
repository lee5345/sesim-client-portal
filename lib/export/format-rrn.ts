export function formatRrnForExport(plaintext: string): string {
  const digits = plaintext.replace(/\D/g, "");
  if (digits.length === 13) {
    return `${digits.slice(0, 6)}-${digits.slice(6)}`;
  }
  return plaintext;
}
