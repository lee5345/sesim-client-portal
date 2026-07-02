"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Bell, BellOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useRealtimeSync } from "@/components/layout/realtime-sync-provider";
import {
  acknowledgeTenantChangesAction,
  listUnreadTenantChangeEntityIdsAction,
} from "@/lib/realtime/sync-actions";
import type { TenantChangeEntityType } from "@/lib/generated/prisma/client";

type NewEntriesControlsProps = {
  companyId: string;
  entityTypes: TenantChangeEntityType[];
  onShowUnreadEntries: (ids: string[]) => void;
  onClearUnreadFilter: () => void;
};

export function NewEntriesControls({
  companyId,
  entityTypes,
  onShowUnreadEntries,
  onClearUnreadFilter,
}: NewEntriesControlsProps) {
  const { notifications, refreshNow } = useRealtimeSync();
  const [mode, setMode] = useState<"show" | "confirm">("show");
  const [isPending, startTransition] = useTransition();

  const count = useMemo(() => {
    const companyCounts = notifications.companyModuleBadges[companyId] ?? {};
    return entityTypes.reduce((sum, entityType) => sum + (companyCounts[entityType] ?? 0), 0);
  }, [companyId, entityTypes, notifications.companyModuleBadges]);

  useEffect(() => {
    if (count <= 0) {
      setMode("show");
    }
  }, [count]);

  if (count <= 0) {
    return null;
  }

  if (mode === "confirm") {
    return (
      <Button
        type="button"
        className="bg-brand-gold/85 text-sidebar hover:bg-brand-gold/85"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            await acknowledgeTenantChangesAction({ companyId, entityTypes });
            await refreshNow();
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
          const ids = await listUnreadTenantChangeEntityIdsAction({
            companyId,
            entityTypes,
          });
          onShowUnreadEntries(ids);
          setMode("confirm");
        });
      }}
    >
      <Bell />
      변경사항 조회 ({count})
    </Button>
  );
}

