export function formatExportDefaultTitle(
  title: string,
  companyName?: string,
): string {
  const trimmedTitle = title.trim();
  const trimmedCompanyName = companyName?.trim();

  if (!trimmedCompanyName) {
    return trimmedTitle;
  }

  return `${trimmedCompanyName} - ${trimmedTitle}`;
}
