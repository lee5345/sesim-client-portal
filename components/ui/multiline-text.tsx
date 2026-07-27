import { cn } from "@/lib/utils";

export const EMPTY_MULTILINE_TEXT = "—";

export const notesBodyCellClassName =
  "border-r border-border/30 px-4 py-3 align-top whitespace-normal break-words last:border-r-0";

type MultilineTextProps = {
  value: string | null | undefined;
  emptyLabel?: string;
  className?: string;
};

export function MultilineText({
  value,
  emptyLabel = EMPTY_MULTILINE_TEXT,
  className,
}: MultilineTextProps) {
  if (!value?.trim()) {
    return <span className={cn("text-muted-foreground", className)}>{emptyLabel}</span>;
  }

  return (
    <span className={cn("block whitespace-pre-wrap break-words", className)}>
      {value}
    </span>
  );
}
