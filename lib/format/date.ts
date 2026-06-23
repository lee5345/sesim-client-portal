const DISPLAY_TIME_ZONE = "Asia/Seoul";

const dateFormatter = new Intl.DateTimeFormat("sv-SE", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: DISPLAY_TIME_ZONE,
});

const dateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: DISPLAY_TIME_ZONE,
});

const koreanDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: DISPLAY_TIME_ZONE,
});

const koreanTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: DISPLAY_TIME_ZONE,
});

function toKoreanDayPeriod(value: string): string {
  if (value === "오전" || value === "오후") return value;
  const normalized = value.toLowerCase().replace(/\./g, "");
  if (normalized === "am") return "오전";
  if (normalized === "pm") return "오후";
  return value;
}

function formatWithKoreanDayPeriod(
  formatter: Intl.DateTimeFormat,
  date: Date,
): string {
  return formatter
    .formatToParts(date)
    .map(({ type, value }) =>
      type === "dayPeriod" ? toKoreanDayPeriod(value) : value,
    )
    .join("");
}

export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}

export function formatDateTime(date: Date): string {
  return formatWithKoreanDayPeriod(dateTimeFormatter, date);
}

export function formatKoreanDate(date: Date): string {
  return koreanDateFormatter.format(date);
}

export function formatKoreanTime(date: Date): string {
  return formatWithKoreanDayPeriod(koreanTimeFormatter, date);
}
