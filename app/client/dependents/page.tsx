import type { Metadata } from "next";

import { requireAuth } from "@/lib/auth/guards";
import { DependentsTable } from "@/components/client/dependents-table";
import { formatDate } from "@/lib/format/date";
import { listDependentRecords } from "@/modules/dependents/actions";

export const metadata: Metadata = {
  title: "피부양자 정보",
};

export default async function ClientDependentsPage() {
  const session = await requireAuth("CLIENT_ADMIN");
  const companyId = session.user.companyId;

  if (!companyId) {
    return <p className="text-muted-foreground">소속 회사 정보가 없습니다.</p>;
  }

  const dependentRecords = await listDependentRecords(companyId);

  const rows = dependentRecords.map((row) => ({
    ...row,
    registrationRequestedDate: formatDate(row.registrationRequestedDate),
    createdAt: row.createdAt.toISOString(),
  }));

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">피부양자 정보</h1>
        <p className="mt-1 text-muted-foreground">
          건강보험 피부양자 정보를 등록하고 관리합니다.
        </p>
      </div>

      <DependentsTable dependentRecords={rows} companyId={companyId} />
    </div>
  );
}
