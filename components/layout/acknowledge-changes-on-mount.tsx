"use client";

import { useEffect } from "react";

import { acknowledgeTenantChangesAction } from "@/lib/realtime/sync-actions";
import { useOptionalRealtimeSync } from "@/components/layout/realtime-sync-provider";
import type { TenantChangeEntityType } from "@/lib/generated/prisma/client";

type AcknowledgeChangesOnMountProps = {
  companyId: string;
  entityTypes: TenantChangeEntityType[];
};

export function AcknowledgeChangesOnMount({
  companyId,
  entityTypes,
}: AcknowledgeChangesOnMountProps) {
  const refreshNow = useOptionalRealtimeSync()?.refreshNow;
  const entityTypesKey = entityTypes.slice().sort().join(",");

  useEffect(() => {
    let cancelled = false;

    void acknowledgeTenantChangesAction({ companyId, entityTypes }).then(() => {
      if (!cancelled) {
        void refreshNow?.();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [companyId, entityTypesKey, entityTypes, refreshNow]);

  return null;
}
