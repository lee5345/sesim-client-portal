"use client";

import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TerminationFilterValues } from "@/lib/filters/terminations";

export type { TerminationFilterValues };

type TerminationsFiltersProps = {
  draft: TerminationFilterValues;
  onDraftChange: (next: TerminationFilterValues) => void;
  onSearch: () => void;
  onClear: () => void;
};

export function TerminationsFilters({
  draft,
  onDraftChange,
  onSearch,
  onClear,
}: TerminationsFiltersProps) {
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
