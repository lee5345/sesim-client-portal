"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Bell, BellOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useRealtimeSync } from "@/components/layout/realtime-sync-provider";
import {
  acknowledgeTenantChangesAction,
  getEarliestUnreadPeriodScopedPeriodAction,
  listUnreadTenantChangeEntityIdsAction,
} from "@/lib/realtime/sync-actions";
import type { TenantChangeEntityType } from "@/lib/generated/prisma/client";

type PeriodScope = {
  year: number;
  month: number;
  basePath: string;
};

type NewEntriesControlsProps = {
  companyId: string;
  entityTypes: TenantChangeEntityType[];
  onShowUnreadEntries: (ids: string[]) => void;
  onClearUnreadFilter: () => void;
  periodScope?: PeriodScope;
  reviewActive?: boolean;
  onReviewActiveChange?: (active: boolean) => void;
};

function buildPeriodNavigationUrl(
  basePath: string,
  searchParams: URLSearchParams,
  year: number,
  month: number,
  options?: {
    firmTab?: string;
    compensationTab?: string;
  },
): string {
  const params = new URLSearchParams(searchParams.toString());
  params.set("year", String(year));
  params.set("month", String(month));
  params.set("showUnread", "1");
  if (basePath.includes("/firm/companies/")) {
    params.set("tab", options?.firmTab ?? "daily-workers");
  }
  if (options?.compensationTab) {
    params.set("compensationTab", options.compensationTab);
  }
  return `${basePath}?${params.toString()}`;
}

function getPeriodScopedEntityType(
  entityTypes: TenantChangeEntityType[],
): "DAILY_WORKER" | "COMPENSATION_INFO" | undefined {
  if (entityTypes.includes("DAILY_WORKER")) {
    return "DAILY_WORKER";
  }
  if (entityTypes.includes("COMPENSATION_INFO")) {
    return "COMPENSATION_INFO";
  }
  return undefined;
}

export function NewEntriesControls({
  companyId,
  entityTypes,
  onShowUnreadEntries,
  onClearUnreadFilter,
  periodScope,
  reviewActive = false,
  onReviewActiveChange,
}: NewEntriesControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { notifications, refreshNow } = useRealtimeSync();
  const [mode, setMode] = useState<"show" | "confirm">("show");
  const [isPending, startTransition] = useTransition();

  const count = useMemo(() => {
    const companyCounts = notifications.companyModuleBadges[companyId] ?? {};
    return entityTypes.reduce((sum, entityType) => sum + (companyCounts[entityType] ?? 0), 0);
  }, [companyId, entityTypes, notifications.companyModuleBadges]);

  const showConfirm = reviewActive || mode === "confirm";

  useEffect(() => {
    if (count <= 0) {
      setMode("show");
      onReviewActiveChange?.(false);
    }
  }, [count, onReviewActiveChange]);

  useEffect(() => {
    if (reviewActive) {
      setMode("confirm");
    }
  }, [reviewActive]);

  if (count <= 0) {
    return null;
  }

  if (showConfirm) {
    return (
      <Button
        type="button"
        className="bg-brand-gold/85 text-sidebar hover:bg-brand-gold/85"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            await acknowledgeTenantChangesAction({
              companyId,
              entityTypes,
              periodYear: periodScope?.year,
              periodMonth: periodScope?.month,
            });
            await refreshNow();
            setMode("show");
            onReviewActiveChange?.(false);
            onClearUnreadFilter();
          });
        }}
      >
        <BellOff />
        조회 완료
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="border-brand-gold/85 bg-brand-gold/15 text-foreground hover:bg-brand-gold/25"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const periodScopedType = periodScope
            ? getPeriodScopedEntityType(entityTypes)
            : undefined;

          if (periodScope && periodScopedType) {
            const earliest = await getEarliestUnreadPeriodScopedPeriodAction({
              companyId,
              entityType: periodScopedType,
            });

            if (!earliest) {
              return;
            }

            if (
              earliest.year !== periodScope.year ||
              earliest.month !== periodScope.month
            ) {
              router.push(
                buildPeriodNavigationUrl(
                  periodScope.basePath,
                  new URLSearchParams(searchParams.toString()),
                  earliest.year,
                  earliest.month,
                  {
                    firmTab:
                      periodScopedType === "COMPENSATION_INFO"
                        ? "compensation-info"
                        : "daily-workers",
                  },
                ),
              );
              return;
            }
          }

          const ids = await listUnreadTenantChangeEntityIdsAction({
            companyId,
            entityTypes,
            periodYear: periodScope?.year,
            periodMonth: periodScope?.month,
          });
          onShowUnreadEntries(ids);
          setMode("confirm");
          onReviewActiveChange?.(true);
        });
      }}
    >
      <Bell />
      변경사항 조회 ({count})
    </Button>
  );
}
