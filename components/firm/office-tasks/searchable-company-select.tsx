"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { UNSPECIFIED_COMPANY_LABEL } from "@/lib/office-tasks/display";
import type { OfficeTaskCompanyOption } from "@/lib/office-tasks/types";
import { cn } from "@/lib/utils";

type SearchableCompanySelectProps = {
  id: string;
  label?: string;
  companies: OfficeTaskCompanyOption[];
  value: string | null;
  onChange: (companyId: string | null) => void;
  disabled?: boolean;
  className?: string;
};

export function SearchableCompanySelect({
  id,
  label = "관련 고객사",
  companies,
  value,
  onChange,
  disabled = false,
  className,
}: SearchableCompanySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === value) ?? null,
    [companies, value],
  );

  const filteredCompanies = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return companies.filter((company) => {
      if (value && company.id === value) {
        return true;
      }
      if (!company.isActive) {
        return false;
      }
      if (!trimmed) {
        return true;
      }
      return company.name.toLowerCase().includes(trimmed);
    });
  }, [companies, query, value]);

  const displayLabel = selectedCompany?.name ?? UNSPECIFIED_COMPANY_LABEL;

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          disabled={disabled}
          render={
            <Button
              id={id}
              type="button"
              variant="outline"
              disabled={disabled}
              className="h-8 w-full justify-between font-normal"
            />
          }
        >
          <span className="truncate">{displayLabel}</span>
          <ChevronDown className="size-4 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="gap-0 p-2"
        >
          <div className="space-y-2">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                placeholder="회사명 검색"
                className="pl-8"
                onChange={(event) => setQuery(event.target.value)}
                aria-label="회사명 검색"
              />
            </div>

            <div className="max-h-48 space-y-0.5 overflow-y-auto">
              <button
                type="button"
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted",
                  value === null && "bg-primary/10 font-medium",
                )}
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                  setQuery("");
                }}
              >
                <span>{UNSPECIFIED_COMPANY_LABEL}</span>
                {value === null ? <Check className="size-4" /> : null}
              </button>

              {filteredCompanies.length === 0 ? (
                <p className="px-2 py-3 text-center text-sm text-muted-foreground">
                  검색 결과가 없습니다.
                </p>
              ) : (
                filteredCompanies.map((company) => {
                  const selected = company.id === value;
                  return (
                    <button
                      key={company.id}
                      type="button"
                      className={cn(
                        "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted",
                        selected && "bg-primary/10 font-medium",
                      )}
                      onClick={() => {
                        onChange(company.id);
                        setOpen(false);
                        setQuery("");
                      }}
                    >
                      <span className="truncate">
                        {company.name}
                        {!company.isActive ? (
                          <span className="ml-1 text-muted-foreground">
                            (비활성)
                          </span>
                        ) : null}
                      </span>
                      {selected ? <Check className="size-4 shrink-0" /> : null}
                    </button>
                  );
                })
              )}
            </div>

            {value ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  onChange(null);
                  setQuery("");
                }}
              >
                <X />
                선택 해제
              </Button>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
