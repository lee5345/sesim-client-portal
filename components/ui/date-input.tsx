"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type DateInputProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

export function DateInput({
  id,
  value,
  onChange,
  required = false,
  disabled = false,
  className,
}: DateInputProps) {
  return (
    <Input
      id={id}
      type="date"
      lang="ko-KR"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      required={required}
      disabled={disabled}
      title="YYYY-MM-DD"
      className={cn("font-mono tabular-nums", className)}
    />
  );
}
