import { formatKoreanDate, formatKoreanTime } from "@/lib/format/date";

type CompactDateTimeProps = {
  date: Date;
};

export function CompactDateTime({ date }: CompactDateTimeProps) {
  return (
    <div className="space-y-1">
      <div className="whitespace-nowrap">{formatKoreanDate(date)}</div>
      <div className="whitespace-nowrap text-muted-foreground">
        {formatKoreanTime(date)}
      </div>
    </div>
  );
}
