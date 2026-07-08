import type { Metadata } from "next";

import { requireAuth } from "@/lib/auth/guards";
import { CompensationChangesTable } from "@/components/client/compensation-changes-table";
import { listCompensationChanges } from "@/modules/compensation-changes/actions";

export const metadata: Metadata = {
  title: "급여변경 정보",
};

export default async function ClientCompensationChangesPage() {
  const session = await requireAuth("CLIENT_ADMIN");
  const companyId = session.user.companyId;

  if (!companyId) {
    return <p className="text-muted-foreground">소속 회사 정보가 없습니다.</p>;
  }

  const compensationChanges = await listCompensationChanges(companyId);

  const changeRows = compensationChanges.map((row) => ({
    ...row,
    changeDate: row.changeDate.toISOString().slice(0, 10),
    createdAt: row.createdAt.toISOString(),
  }));

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">급여변경 정보</h1>
        <p className="mt-1 text-muted-foreground">등록된 급여변경 내역을 확인하고 관리합니다.</p>
      </div>

      <CompensationChangesTable compensationChanges={changeRows} companyId={companyId} />
    </div>
  );
}
