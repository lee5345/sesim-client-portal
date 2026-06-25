"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

import { Tabs } from "@/components/ui/tabs";

const COMPANY_TABS = [
  "new-hires",
  "terminations",
  "daily-workers",
  "compensation",
] as const;

type CompanyTabValue = (typeof COMPANY_TABS)[number];

type CompanyDetailTabsProps = {
  defaultTab?: CompanyTabValue;
  children: ReactNode;
};

function isCompanyTab(value: string | null): value is CompanyTabValue {
  return COMPANY_TABS.includes(value as CompanyTabValue);
}

export function CompanyDetailTabs({
  defaultTab = "new-hires",
  children,
}: CompanyDetailTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab = isCompanyTab(tabParam) ? tabParam : defaultTab;

  return (
    <Tabs
      value={activeTab}
      onValueChange={(nextTab) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", String(nextTab));
        router.replace(`?${params.toString()}`);
      }}
    >
      {children}
    </Tabs>
  );
}
