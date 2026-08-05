import type { Metadata } from "next";
import { Suspense } from "react";

import { ActivityLogPage } from "@/components/firm/activity-log/activity-log-page";
import { requireAuth } from "@/lib/auth/guards";
import { listCompanies } from "@/modules/companies/companies";

export const metadata: Metadata = {
  title: "활동 기록 보관함",
};

export default async function FirmActivityLogPage({
  searchParams,
}: {
  searchParams: Promise<{ companyId?: string }>;
}) {
  await requireAuth(["FIRM_STAFF", "FIRM_ADMIN"]);

  const [{ companyId }, companies] = await Promise.all([
    searchParams,
    listCompanies(),
  ]);

  return (
    <Suspense fallback={null}>
      <ActivityLogPage
        companies={companies.map((company) => ({
          id: company.id,
          name: company.name,
          isActive: company.isActive,
        }))}
        initialCompanyId={companyId ?? null}
      />
    </Suspense>
  );
}
