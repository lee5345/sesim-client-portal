import type { Metadata } from "next";

import { requireAuth } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "퇴사자 정보",
};
import { TerminationsTable } from "@/components/client/terminations-table";
import { getCompanyById } from "@/modules/companies/companies";
import { listTerminations } from "@/modules/terminations/actions";

export default async function ClientTerminationsPage() {
  const session = await requireAuth("CLIENT_ADMIN");
  const companyId = session.user.companyId;

  if (!companyId) {
    return <p className="text-muted-foreground">소속 회사 정보가 없습니다.</p>;
  }

  const [terminations, company] = await Promise.all([
    listTerminations(companyId),
    getCompanyById(companyId),
  ]);

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">퇴사자 정보</h1>
        <p className="mt-1 text-muted-foreground">
          퇴사자 정보를 등록하고 관리합니다.
        </p>
      </div>

      <TerminationsTable
        terminations={terminations}
        companyId={companyId}
        companyName={company?.name}
      />
    </div>
  );
}
