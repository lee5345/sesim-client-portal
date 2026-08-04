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

export function formatYearMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
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

export function formatRelativeTime(date: Date, baseDate = new Date()): string {
  const diffSeconds = Math.max(
    0,
    Math.floor((baseDate.getTime() - date.getTime()) / 1000),
  );

  if (diffSeconds < 60) {
    return "방금 전";
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes}분 전`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}시간 전`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return `${diffDays}일 전`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return `${diffMonths}개월 전`;
  }

  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears}년 전`;
}
