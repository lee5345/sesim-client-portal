"use client";

import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BusinessIncomeFilterValues } from "@/lib/filters/business-income";

export type BusinessIncomeFiltersValues = BusinessIncomeFilterValues;

export { EMPTY_BUSINESS_INCOME_FILTERS } from "@/lib/filters/business-income";

type BusinessIncomeFiltersProps = {
  draft: BusinessIncomeFiltersValues;
  onDraftChange: (next: BusinessIncomeFiltersValues) => void;
  onSearch: () => void;
  onClear: () => void;
};

export function BusinessIncomeFilters({
  draft,
  onDraftChange,
  onSearch,
  onClear,
}: BusinessIncomeFiltersProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor="business-income-name-filter">이름</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="business-income-name-filter"
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
