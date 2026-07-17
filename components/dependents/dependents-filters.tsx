"use client";

import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DependentFilterValues } from "@/lib/filters/dependents";

export type { DependentFilterValues };
export { EMPTY_DEPENDENT_FILTERS } from "@/lib/filters/dependents";

type DependentsFiltersProps = {
  draft: DependentFilterValues;
  onDraftChange: (next: DependentFilterValues) => void;
  onSearch: () => void;
  onClear: () => void;
  disabled?: boolean;
};

export function DependentsFilters({
  draft,
  onDraftChange,
  onSearch,
  onClear,
  disabled = false,
}: DependentsFiltersProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor="dependent-name-filter">이름</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="dependent-name-filter"
              value={draft.name}
              placeholder="직원 이름으로 검색"
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
          <Label>등록 희망일</Label>
          <div className="flex items-center gap-2">
            <DateInput
              id="dependent-registration-date-from"
              value={draft.registrationDateFrom}
              onChange={(registrationDateFrom) =>
                onDraftChange({ ...draft, registrationDateFrom })
              }
              className="w-[10.5rem]"
              disabled={disabled}
            />
            <span className="text-muted-foreground">~</span>
            <DateInput
              id="dependent-registration-date-to"
              value={draft.registrationDateTo}
              onChange={(registrationDateTo) =>
                onDraftChange({ ...draft, registrationDateTo })
              }
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
