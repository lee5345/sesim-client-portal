"use client";

import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { DailyWorkerOccupation, SalaryBasis } from "@/lib/generated/prisma/client";
import {
  DAILY_WORKER_OCCUPATIONS,
  DAILY_WORKER_OCCUPATION_LABELS,
} from "@/modules/daily-workers/constants";
import { SALARY_BASIS_LABELS } from "@/modules/hire-intakes/labels";

export type DailyWorkersFilterValues = {
  name: string;
  occupation: DailyWorkerOccupation | "";
  salaryBasis: SalaryBasis | "";
};

export const EMPTY_DAILY_WORKER_FILTERS: DailyWorkersFilterValues = {
  name: "",
  occupation: "",
  salaryBasis: "",
};

type DailyWorkersFiltersProps = {
  draft: DailyWorkersFilterValues;
  onDraftChange: (next: DailyWorkersFilterValues) => void;
  onSearch: () => void;
  onClear: () => void;
};

const selectClassName =
  "flex h-8 w-full min-w-[9rem] items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 lg:w-[11rem]";

export function DailyWorkersFilters({
  draft,
  onDraftChange,
  onSearch,
  onClear,
}: DailyWorkersFiltersProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor="daily-worker-name-filter">이름</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="daily-worker-name-filter"
              value={draft.name}
              placeholder="이름으로 검색"
              className="pl-8"
              onChange={(event) => onDraftChange({ ...draft, name: event.target.value })}
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
          <Label htmlFor="daily-worker-occupation-filter">직종</Label>
          <select
            id="daily-worker-occupation-filter"
            className={cn(selectClassName, draft.occupation && "border-primary/30")}
            value={draft.occupation}
            onChange={(event) =>
              onDraftChange({
                ...draft,
                occupation: event.target.value as DailyWorkerOccupation | "",
              })
            }
          >
            <option value="">전체</option>
            {DAILY_WORKER_OCCUPATIONS.map((occupation) => (
              <option key={occupation.value} value={occupation.value}>
                {DAILY_WORKER_OCCUPATION_LABELS[occupation.value]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="daily-worker-salary-basis-filter">기준</Label>
          <select
            id="daily-worker-salary-basis-filter"
            className={cn(selectClassName, draft.salaryBasis && "border-primary/30")}
            value={draft.salaryBasis}
            onChange={(event) =>
              onDraftChange({
                ...draft,
                salaryBasis: event.target.value as SalaryBasis | "",
              })
            }
          >
            <option value="">전체</option>
            <option value="GROSS">{SALARY_BASIS_LABELS.GROSS}</option>
            <option value="NET">{SALARY_BASIS_LABELS.NET}</option>
          </select>
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

