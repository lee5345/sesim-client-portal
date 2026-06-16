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
import { cn } from "@/lib/utils";

export type HireIntakeFilterValues = {
  name: string;
  hireDateFrom: string;
  hireDateTo: string;
  departments: string[];
};

export const EMPTY_HIRE_INTAKE_FILTERS: HireIntakeFilterValues = {
  name: "",
  hireDateFrom: "",
  hireDateTo: "",
  departments: [],
};

type DepartmentOption = {
  id: string;
  name: string;
};

type HireIntakesFiltersProps = {
  departments: DepartmentOption[];
  draft: HireIntakeFilterValues;
  onDraftChange: (next: HireIntakeFilterValues) => void;
  onSearch: () => void;
  onClear: () => void;
};

export function HireIntakesFilters({
  departments,
  draft,
  onDraftChange,
  onSearch,
  onClear,
}: HireIntakesFiltersProps) {
  const [departmentMenuOpen, setDepartmentMenuOpen] = useState(false);

  const departmentLabel =
    draft.departments.length === 0
      ? "부서"
      : `부서 (${draft.departments.length})`;

  function toggleDepartment(name: string) {
    const next = draft.departments.includes(name)
      ? draft.departments.filter((department) => department !== name)
      : [...draft.departments, name];
    onDraftChange({ ...draft, departments: next });
  }

  function handleNameChange(name: string) {
    onDraftChange({ ...draft, name });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor="hire-intake-name-filter">이름</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="hire-intake-name-filter"
              value={draft.name}
              placeholder="이름으로 검색"
              className="pl-8"
              onChange={(event) => handleNameChange(event.target.value)}
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
          <Label>입사일</Label>
          <div className="flex items-center gap-2">
            <DateInput
              id="hire-intake-date-from"
              value={draft.hireDateFrom}
              onChange={(hireDateFrom) =>
                onDraftChange({ ...draft, hireDateFrom })
              }
              className="w-[10.5rem]"
            />
            <span className="text-muted-foreground">~</span>
            <DateInput
              id="hire-intake-date-to"
              value={draft.hireDateTo}
              onChange={(hireDateTo) =>
                onDraftChange({ ...draft, hireDateTo })
              }
              className="w-[10.5rem]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>부서</Label>
          <Popover open={departmentMenuOpen} onOpenChange={setDepartmentMenuOpen}>
            <PopoverTrigger
              className={cn(
                "flex h-8 w-full min-w-[9rem] items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 lg:w-[11rem]",
                draft.departments.length > 0 && "border-primary/30",
              )}
            >
              <span className="truncate">{departmentLabel}</span>
              <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
            </PopoverTrigger>
            <PopoverContent align="start" className="w-56 p-2">
              {departments.length === 0 ? (
                <p className="px-2 py-1.5 text-sm text-muted-foreground">
                  등록된 부서가 없습니다.
                </p>
              ) : (
                <div className="max-h-56 space-y-0.5 overflow-y-auto">
                  {departments.map((department) => {
                    const checked = draft.departments.includes(department.name);

                    return (
                      <label
                        key={department.id}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                      >
                        <input
                          type="checkbox"
                          className="size-3.5 rounded border-input accent-primary"
                          checked={checked}
                          onChange={() => toggleDepartment(department.name)}
                        />
                        <span className="truncate">{department.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
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
