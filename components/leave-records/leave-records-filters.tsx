"use client";

import { useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { LeaveRecordFilterValues } from "@/lib/filters/leave-records";
import type { LeaveType } from "@/lib/generated/prisma/client";
import { cn } from "@/lib/utils";
import {
  LEAVE_TYPES,
  LEAVE_TYPE_LABELS,
} from "@/modules/leave-records/constants";

export type { LeaveRecordFilterValues };
export { EMPTY_LEAVE_RECORD_FILTERS } from "@/lib/filters/leave-records";

type LeaveRecordsFiltersProps = {
  draft: LeaveRecordFilterValues;
  onDraftChange: (next: LeaveRecordFilterValues) => void;
  onSearch: () => void;
  onClear: () => void;
  disabled?: boolean;
};

const selectClassName =
  "flex h-8 w-full min-w-[9rem] items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 lg:w-[11rem]";

export function LeaveRecordsFilters({
  draft,
  onDraftChange,
  onSearch,
  onClear,
  disabled = false,
}: LeaveRecordsFiltersProps) {
  const [leaveTypeMenuOpen, setLeaveTypeMenuOpen] = useState(false);

  const leaveTypeLabel =
    draft.leaveTypes.length === 0
      ? "종류"
      : `종류 (${draft.leaveTypes.length})`;

  function toggleLeaveType(leaveType: LeaveType) {
    const next = draft.leaveTypes.includes(leaveType)
      ? draft.leaveTypes.filter((value) => value !== leaveType)
      : [...draft.leaveTypes, leaveType];
    onDraftChange({ ...draft, leaveTypes: next });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor="leave-record-name-filter">이름</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="leave-record-name-filter"
              value={draft.name}
              placeholder="이름으로 검색"
              className="pl-8"
              disabled={disabled}
              onChange={(event) =>
                onDraftChange({ ...draft, name: event.target.value })
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onSearch();
                }
              }}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>종류</Label>
          <Popover
            open={leaveTypeMenuOpen}
            onOpenChange={(open) => {
              if (disabled) return;
              setLeaveTypeMenuOpen(open);
            }}
          >
            <PopoverTrigger
              disabled={disabled}
              className={cn(
                selectClassName,
                draft.leaveTypes.length > 0 && "border-primary/30",
                disabled && "cursor-not-allowed opacity-50",
              )}
            >
              <span className="truncate">{leaveTypeLabel}</span>
              <ChevronDown className="size-4 shrink-0 opacity-60" />
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 p-2">
              <div className="max-h-64 space-y-1 overflow-y-auto">
                {LEAVE_TYPES.map((leaveType) => (
                  <label
                    key={leaveType}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                  >
                    <input
                      type="checkbox"
                      checked={draft.leaveTypes.includes(leaveType)}
                      onChange={() => toggleLeaveType(leaveType)}
                    />
                    <span>{LEAVE_TYPE_LABELS[leaveType]}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1.5">
          <Label>기간</Label>
          <div className="flex items-center gap-2">
            <DateInput
              id="leave-record-period-from"
              value={draft.periodFrom}
              onChange={(periodFrom) => onDraftChange({ ...draft, periodFrom })}
              className="w-[10.5rem]"
              disabled={disabled}
            />
            <span className="text-muted-foreground">~</span>
            <DateInput
              id="leave-record-period-to"
              value={draft.periodTo}
              onChange={(periodTo) => onDraftChange({ ...draft, periodTo })}
              className="w-[10.5rem]"
              disabled={disabled}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" onClick={onSearch} disabled={disabled}>
            <Search />
            검색
          </Button>
          <Button type="button" variant="outline" onClick={onClear} disabled={disabled}>
            <X />
            필터 초기화
          </Button>
        </div>
      </div>
    </div>
  );
}
