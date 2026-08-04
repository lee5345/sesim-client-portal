"use client";

import { ArrowLeftRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { ListSortMode } from "@/lib/sort/list-sort";
import { cn } from "@/lib/utils";

type SortBySelectProps = {
  id: string;
  defaultLabel: string;
  value: ListSortMode;
  onChange: (value: ListSortMode) => void;
  disabled?: boolean;
  className?: string;
};

export function SortBySelect({
  id,
  defaultLabel,
  value,
  onChange,
  disabled = false,
  className,
}: SortBySelectProps) {
  const defaultSortLabel = `${defaultLabel}순`;
  const createdAtSortLabel = "등록일순";
  const label = value === "default" ? defaultSortLabel : createdAtSortLabel;

  return (
    <div className={cn("flex flex-col items-end gap-1.5", className)}>
      <Label htmlFor={id} className="text-right">
        정렬 기준
      </Label>
      <Button
        id={id}
        type="button"
        variant="outline"
        disabled={disabled}
        aria-label={`정렬 기준: ${label}. 전환하려면 클릭하세요.`}
        title="정렬 기준 전환"
        className="gap-1.5 px-2.5"
        onClick={() => onChange(value === "default" ? "createdAt" : "default")}
      >
        <span className="grid justify-items-start">
          <span className="invisible col-start-1 row-start-1 whitespace-nowrap" aria-hidden>
            {defaultSortLabel}
          </span>
          <span className="invisible col-start-1 row-start-1 whitespace-nowrap" aria-hidden>
            {createdAtSortLabel}
          </span>
          <span className="col-start-1 row-start-1 whitespace-nowrap">{label}</span>
        </span>
        <ArrowLeftRight className="size-3.5" />
      </Button>
    </div>
  );
}
