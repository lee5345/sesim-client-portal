"use client";

import { cn } from "@/lib/utils";

type NotesTextareaProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  maxLength?: number;
  rows?: number;
  className?: string;
};

export function NotesTextarea({
  id,
  value,
  onChange,
  disabled = false,
  maxLength = 500,
  rows = 3,
  className,
}: NotesTextareaProps) {
  return (
    <div className="space-y-1">
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        maxLength={maxLength}
        rows={rows}
        className={className}
      />
      <p className="text-right text-xs text-muted-foreground">
        {value.length}/{maxLength}
      </p>
    </div>
  );
}
