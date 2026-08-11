"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type ActivityLogCompanyOption = {
  id: string;
  name: string;
};

type ActivityLogCompanyListProps = {
  companies: ActivityLogCompanyOption[];
  selectedCompanyId: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (companyId: string) => void;
};

export function ActivityLogCompanyList({
  companies,
  selectedCompanyId,
  search,
  onSearchChange,
  onSelect,
}: ActivityLogCompanyListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const updateScrollFades = useCallback(() => {
    const element = listRef.current;
    if (!element) {
      setCanScrollUp(false);
      setCanScrollDown(false);
      return;
    }

    const { scrollTop, clientHeight, scrollHeight } = element;
    setCanScrollUp(scrollTop > 1);
    setCanScrollDown(scrollTop + clientHeight < scrollHeight - 1);
  }, []);

  useEffect(() => {
    updateScrollFades();
  }, [companies, search, updateScrollFades]);

  useEffect(() => {
    const element = listRef.current;
    if (!element || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      updateScrollFades();
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [updateScrollFades]);

  return (
    <aside className="flex h-full min-h-0 w-44 shrink-0 flex-col border-r bg-muted/20 lg:w-52">
      <div className="space-y-2 border-b bg-muted/50 p-3">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          고객사
        </p>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            placeholder="고객사 검색"
            className="pl-8"
            onChange={(event) => onSearchChange(event.target.value)}
            aria-label="고객사 검색"
          />
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        {canScrollUp ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-black/30 to-transparent"
          />
        ) : null}
        {canScrollDown ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8 bg-gradient-to-t from-black/30 to-transparent"
          />
        ) : null}

        <div
          ref={listRef}
          onScroll={updateScrollFades}
          className="h-full overflow-y-auto p-1.5"
        >
          {companies.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              검색 결과가 없습니다.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {companies.map((company) => {
                const selected = company.id === selectedCompanyId;

                return (
                  <li key={company.id} className="min-w-0">
                    <button
                      type="button"
                      onClick={() => onSelect(company.id)}
                      title={company.name}
                      className={cn(
                        "flex w-full min-w-0 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                        selected
                          ? "bg-primary/10 font-medium text-foreground"
                          : "text-foreground/90 hover:bg-muted",
                      )}
                      aria-current={selected ? "true" : undefined}
                    >
                      <span className="block min-w-0 truncate">
                        {company.name}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
}
