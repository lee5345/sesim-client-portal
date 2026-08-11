"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";

import { MultiSelectFilter } from "@/components/filters/multi-select-filter";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getRoleLabel } from "@/lib/auth/roles";
import type { AuditLogFilterValues } from "@/lib/filters/audit-logs";
import type { AuditLogActorOption } from "@/modules/audit-logs/actions";
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ACTION_OPTIONS,
  AUDIT_TABLE_NAME_LABELS,
  AUDIT_TABLE_NAME_OPTIONS,
  type AuditLogActionFilter,
  type AuditLogTableName,
} from "@/modules/audit-logs/labels";

type ActivityLogFiltersProps = {
  actors: AuditLogActorOption[];
  draft: AuditLogFilterValues;
  onDraftChange: (next: AuditLogFilterValues) => void;
  onSearch: () => void;
  onClear: () => void;
  disabled?: boolean;
};

const fullWidthTriggerClassName = "w-full min-w-0 lg:w-full";

export function ActivityLogFilters({
  actors,
  draft,
  onDraftChange,
  onSearch,
  onClear,
  disabled = false,
}: ActivityLogFiltersProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [moduleMenuOpen, setModuleMenuOpen] = useState(false);

  function toggleActor(actorId: string) {
    const next = draft.actorIds.includes(actorId)
      ? draft.actorIds.filter((id) => id !== actorId)
      : [...draft.actorIds, actorId];
    onDraftChange({ ...draft, actorIds: next });
  }

  function toggleAction(action: AuditLogActionFilter) {
    const next = draft.actions.includes(action)
      ? draft.actions.filter((value) => value !== action)
      : [...draft.actions, action];
    onDraftChange({ ...draft, actions: next });
  }

  function toggleTableName(tableName: AuditLogTableName) {
    const next = draft.tableNames.includes(tableName)
      ? draft.tableNames.filter((value) => value !== tableName)
      : [...draft.tableNames, tableName];
    onDraftChange({ ...draft, tableNames: next });
  }

  return (
    <fieldset
      disabled={disabled}
      className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3 disabled:opacity-60"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-nowrap lg:items-end">
        <div className="min-w-0 flex-1 basis-0">
          <MultiSelectFilter
            label="사용자"
            triggerLabel="사용자"
            selectedCount={draft.actorIds.length}
            open={userMenuOpen}
            onOpenChange={setUserMenuOpen}
            disabled={disabled}
            contentClassName="w-64"
            triggerClassName={fullWidthTriggerClassName}
          >
            {actors.length === 0 ? (
              <p className="px-2 py-1.5 text-sm text-muted-foreground">
                선택 가능한 사용자가 없습니다.
              </p>
            ) : (
              <div className="max-h-56 space-y-0.5 overflow-y-auto">
                {actors.map((actor) => {
                  const checked = draft.actorIds.includes(actor.id);

                  return (
                    <label
                      key={actor.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                    >
                      <input
                        type="checkbox"
                        className="size-3.5 shrink-0 rounded border-input accent-primary"
                        checked={checked}
                        onChange={() => toggleActor(actor.id)}
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {actor.name}
                        <span className="ml-1 text-muted-foreground">
                          ({getRoleLabel(actor.role)})
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </MultiSelectFilter>
        </div>

        <div className="min-w-0 flex-1 basis-0">
          <MultiSelectFilter
            label="작업"
            triggerLabel="작업"
            selectedCount={draft.actions.length}
            open={actionMenuOpen}
            onOpenChange={setActionMenuOpen}
            disabled={disabled}
            contentClassName="w-36"
            triggerClassName={fullWidthTriggerClassName}
          >
            <div className="space-y-0.5">
              {AUDIT_ACTION_OPTIONS.map((action) => {
                const checked = draft.actions.includes(action);

                return (
                  <label
                    key={action}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                  >
                    <input
                      type="checkbox"
                      className="size-3.5 rounded border-input accent-primary"
                      checked={checked}
                      onChange={() => toggleAction(action)}
                    />
                    <span>{AUDIT_ACTION_LABELS[action]}</span>
                  </label>
                );
              })}
            </div>
          </MultiSelectFilter>
        </div>

        <div className="min-w-0 flex-1 basis-0">
          <MultiSelectFilter
            label="모듈"
            triggerLabel="모듈"
            selectedCount={draft.tableNames.length}
            open={moduleMenuOpen}
            onOpenChange={setModuleMenuOpen}
            disabled={disabled}
            contentClassName="w-52"
            triggerClassName={fullWidthTriggerClassName}
          >
            <div className="max-h-56 space-y-0.5 overflow-y-auto">
              {AUDIT_TABLE_NAME_OPTIONS.map((tableName) => {
                const checked = draft.tableNames.includes(tableName);

                return (
                  <label
                    key={tableName}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                  >
                    <input
                      type="checkbox"
                      className="size-3.5 rounded border-input accent-primary"
                      checked={checked}
                      onChange={() => toggleTableName(tableName)}
                    />
                    <span className="truncate">
                      {AUDIT_TABLE_NAME_LABELS[tableName]}
                    </span>
                  </label>
                );
              })}
            </div>
          </MultiSelectFilter>
        </div>

        <div className="w-auto shrink-0 space-y-1.5">
          <Label>일시</Label>
          <div className="flex items-center gap-2">
            <DateInput
              id="audit-log-date-from"
              value={draft.createdAtFrom}
              onChange={(createdAtFrom) =>
                onDraftChange({ ...draft, createdAtFrom })
              }
              className="w-[10.5rem] shrink-0"
            />
            <span className="shrink-0 text-muted-foreground">~</span>
            <DateInput
              id="audit-log-date-to"
              value={draft.createdAtTo}
              onChange={(createdAtTo) =>
                onDraftChange({ ...draft, createdAtTo })
              }
              className="w-[10.5rem] shrink-0"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={draft.payloadQuery}
            placeholder="페이로드로 검색"
            className="pl-8"
            onChange={(event) =>
              onDraftChange({ ...draft, payloadQuery: event.target.value })
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onSearch();
              }
            }}
            aria-label="페이로드으로 검색"
          />
        </div>
        <div className="flex shrink-0 items-center gap-2">
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
    </fieldset>
  );
}
