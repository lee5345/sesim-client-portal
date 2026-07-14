"use client";

import { ChevronDown, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BusinessIncomeFilterValues } from "@/lib/filters/business-income";
import type { SalaryBasis } from "@/lib/generated/prisma/client";
import { cn } from "@/lib/utils";
import { SALARY_BASIS_LABELS } from "@/modules/hire-intakes/labels";

export type BusinessIncomeFiltersValues = BusinessIncomeFilterValues;

export { EMPTY_BUSINESS_INCOME_FILTERS } from "@/lib/filters/business-income";

const selectClassName =
  "flex h-8 w-full min-w-[9rem] items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 lg:w-[11rem]";

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

        <div className="space-y-1.5">
          <Label htmlFor="business-income-basis-filter">소득액 기준</Label>
          <div className="relative">
            <select
              id="business-income-basis-filter"
              className={cn(
                selectClassName,
                "appearance-none pl-2.5 pr-10",
                draft.incomeBasis && "border-primary/30",
              )}
              value={draft.incomeBasis}
              onChange={(event) =>
                onDraftChange({
                  ...draft,
                  incomeBasis: event.target.value as SalaryBasis | "",
                })
              }
            >
              <option value="">전체</option>
              <option value="GROSS">{SALARY_BASIS_LABELS.GROSS}</option>
              <option value="NET">{SALARY_BASIS_LABELS.NET}</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
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
