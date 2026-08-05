"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const triggerClassName =
  "flex h-8 w-full min-w-[9rem] items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 lg:w-[11rem]";

type MultiSelectFilterProps = {
  label: string;
  triggerLabel: string;
  selectedCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
  contentClassName?: string;
  triggerClassName?: string;
  children: ReactNode;
};

export function MultiSelectFilter({
  label,
  triggerLabel,
  selectedCount,
  open,
  onOpenChange,
  disabled = false,
  contentClassName,
  triggerClassName: triggerClassNameProp,
  children,
}: MultiSelectFilterProps) {
  const displayLabel =
    selectedCount === 0 ? triggerLabel : `${triggerLabel} (${selectedCount})`;

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Popover
        modal
        open={open}
        onOpenChange={(nextOpen) => {
          if (disabled) return;
          onOpenChange(nextOpen);
        }}
      >
        <PopoverTrigger
          disabled={disabled}
          className={cn(
            triggerClassName,
            selectedCount > 0 && "border-primary/30",
            disabled && "cursor-not-allowed opacity-50",
            triggerClassNameProp,
          )}
        >
          <span className="truncate">{displayLabel}</span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent align="start" className={cn("p-2", contentClassName)}>
          {children}
          <PopoverClose className="sr-only">닫기</PopoverClose>
        </PopoverContent>
      </Popover>
    </div>
  );
}
