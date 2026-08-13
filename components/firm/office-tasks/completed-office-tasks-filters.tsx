"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";

import { MultiSelectFilter } from "@/components/filters/multi-select-filter";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OfficeTaskFilterValues } from "@/lib/filters/office-tasks";
import type { OfficeTaskCompanyOption } from "@/lib/office-tasks/types";

type CompletedOfficeTasksFiltersProps = {
  draft: OfficeTaskFilterValues;
  onDraftChange: (next: OfficeTaskFilterValues) => void;
  onSearch: () => void;
  onClear: () => void;
  companies: OfficeTaskCompanyOption[];
  disabled?: boolean;
};

export function CompletedOfficeTasksFilters({
  draft,
  onDraftChange,
  onSearch,
  onClear,
  companies,
  disabled = false,
}: CompletedOfficeTasksFiltersProps) {
  const [companyMenuOpen, setCompanyMenuOpen] = useState(false);
  const [companySearch, setCompanySearch] = useState("");

  const filteredCompanies = useMemo(() => {
    const trimmed = companySearch.trim().toLowerCase();
    return companies.filter((company) => {
      if (!trimmed) return true;
      return company.name.toLowerCase().includes(trimmed);
    });
  }, [companies, companySearch]);

  function toggleCompany(companyId: string) {
    const next = draft.companyIds.includes(companyId)
      ? draft.companyIds.filter((id) => id !== companyId)
      : [...draft.companyIds, companyId];
    onDraftChange({ ...draft, companyIds: next });
  }

  return (
    <fieldset
      disabled={disabled}
      className="rounded-lg border bg-muted/20 p-3 disabled:opacity-60"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor="completed-office-task-query">검색</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="completed-office-task-query"
              value={draft.query}
              placeholder="제목 또는 설명으로 검색"
              className="pl-8"
              disabled={disabled}
              onChange={(event) =>
                onDraftChange({ ...draft, query: event.target.value })
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

        <MultiSelectFilter
          label="고객사"
          triggerLabel="고객사"
          selectedCount={draft.companyIds.length}
          open={companyMenuOpen}
          onOpenChange={setCompanyMenuOpen}
          disabled={disabled}
          contentClassName="w-72"
        >
          <div className="space-y-2 p-1">
            <Input
              value={companySearch}
              placeholder="회사명 검색"
              onChange={(event) => setCompanySearch(event.target.value)}
              aria-label="회사명 검색"
            />
            <div className="max-h-56 space-y-0.5 overflow-y-auto">
              {filteredCompanies.map((company) => (
                <label
                  key={company.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                >
                  <input
                    type="checkbox"
                    className="size-3.5 rounded border-input accent-primary"
                    checked={draft.companyIds.includes(company.id)}
                    onChange={() => toggleCompany(company.id)}
                  />
                  <span className="truncate">{company.name}</span>
                </label>
              ))}
            </div>
          </div>
        </MultiSelectFilter>

        <div className="space-y-1.5">
          <Label>완료일</Label>
          <div className="flex items-center gap-2">
            <DateInput
              id="completed-from"
              value={draft.completedFrom}
              onChange={(completedFrom) =>
                onDraftChange({ ...draft, completedFrom })
              }
              className="w-[10.5rem]"
              disabled={disabled}
            />
            <span className="text-muted-foreground">~</span>
            <DateInput
              id="completed-to"
              value={draft.completedTo}
              onChange={(completedTo) =>
                onDraftChange({ ...draft, completedTo })
              }
              className="w-[10.5rem]"
              disabled={disabled}
            />
          </div>
        </div>

        <div className="flex items-end gap-2">
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
    </fieldset>
  );
}
