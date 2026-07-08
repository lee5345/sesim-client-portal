"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

import { Tabs } from "@/components/ui/tabs";

const COMPENSATION_TABS = ["changes", "details"] as const;
type CompensationTabValue = (typeof COMPENSATION_TABS)[number];

function isCompensationTab(value: string | null): value is CompensationTabValue {
  return COMPENSATION_TABS.includes(value as CompensationTabValue);
}

export function CompensationTabs({
  defaultTab = "changes",
  children,
}: {
  defaultTab?: CompensationTabValue;
  children: ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("compensationTab");
  const activeTab = isCompensationTab(tabParam) ? tabParam : defaultTab;

  return (
    <Tabs
      value={activeTab}
      onValueChange={(nextTab) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("compensationTab", String(nextTab));
        router.replace(`?${params.toString()}`);
      }}
    >
      {children}
    </Tabs>
  );
}
