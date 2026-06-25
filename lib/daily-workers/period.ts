const KST_TIME_ZONE = "Asia/Seoul";

export function getCurrentYearMonth() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    timeZone: KST_TIME_ZONE,
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);

  return {
    year: Number.isFinite(year) ? year : now.getFullYear(),
    month: Number.isFinite(month) ? month : now.getMonth() + 1,
  };
}

export function parseYearMonthSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
) {
  const current = getCurrentYearMonth();
  const rawYear = Array.isArray(searchParams.year)
    ? searchParams.year[0]
    : searchParams.year;
  const rawMonth = Array.isArray(searchParams.month)
    ? searchParams.month[0]
    : searchParams.month;

  const year = Number(rawYear);
  const month = Number(rawMonth);

  return {
    year:
      Number.isInteger(year) && year >= 2000 && year <= 2100
        ? year
        : current.year,
    month:
      Number.isInteger(month) && month >= 1 && month <= 12
        ? month
        : current.month,
  };
}
