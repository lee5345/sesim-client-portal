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
import type { TerminationFilterValues } from "@/lib/filters/terminations";
import type { RetirementPayType } from "@/lib/generated/prisma/client";
import { cn } from "@/lib/utils";
import { RETIREMENT_PAY_TYPE_OPTIONS } from "@/modules/terminations/constants";

export type { TerminationFilterValues };

type TerminationsFiltersProps = {
  draft: TerminationFilterValues;
  onDraftChange: (next: TerminationFilterValues) => void;
  onSearch: () => void;
  onClear: () => void;
};

const selectClassName =
  "flex h-8 w-full min-w-[9rem] items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 lg:w-[11rem]";

export function TerminationsFilters({
  draft,
  onDraftChange,
  onSearch,
  onClear,
}: TerminationsFiltersProps) {
  const [retirementPayMenuOpen, setRetirementPayMenuOpen] = useState(false);

  const retirementPayLabel =
    draft.retirementPayTypes.length === 0
      ? "퇴직 급여"
      : `퇴직 급여 (${draft.retirementPayTypes.length})`;

  function toggleRetirementPayType(type: RetirementPayType) {
    const next = draft.retirementPayTypes.includes(type)
      ? draft.retirementPayTypes.filter((value) => value !== type)
      : [...draft.retirementPayTypes, type];
    onDraftChange({ ...draft, retirementPayTypes: next });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor="termination-name-filter">이름</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="termination-name-filter"
              value={draft.name}
              placeholder="이름으로 검색"
              className="pl-8"
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
          <Label>퇴사일</Label>
          <div className="flex items-center gap-2">
            <DateInput
              id="termination-date-from"
              value={draft.terminationDateFrom}
              onChange={(terminationDateFrom) =>
                onDraftChange({ ...draft, terminationDateFrom })
              }
              className="w-[10.5rem]"
            />
            <span className="text-muted-foreground">~</span>
            <DateInput
              id="termination-date-to"
              value={draft.terminationDateTo}
              onChange={(terminationDateTo) =>
                onDraftChange({ ...draft, terminationDateTo })
              }
              className="w-[10.5rem]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>퇴직 급여</Label>
          <Popover
            open={retirementPayMenuOpen}
            onOpenChange={setRetirementPayMenuOpen}
          >
            <PopoverTrigger
              className={cn(
                selectClassName,
                draft.retirementPayTypes.length > 0 && "border-primary/30",
              )}
            >
              <span className="truncate">{retirementPayLabel}</span>
              <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
            </PopoverTrigger>
            <PopoverContent align="start" className="w-56 p-2">
              <div className="space-y-0.5">
                {RETIREMENT_PAY_TYPE_OPTIONS.map((option) => {
                  const checked = draft.retirementPayTypes.includes(option.value);

                  return (
                    <label
                      key={option.value}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                    >
                      <input
                        type="checkbox"
                        className="size-3.5 rounded border-input accent-primary"
                        checked={checked}
                        onChange={() => toggleRetirementPayType(option.value)}
                      />
                      <span className="truncate">{option.label}</span>
                    </label>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" onClick={onSearch}>
            <Search />
            검색
          </Button>
          <Button type="button" variant="outline" onClick={onClear}>
            <X />
            필터 초기화
          </Button>
        </div>
      </div>
    </div>
  );
}
