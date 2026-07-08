import type { Metadata } from "next";

import { requireAuth } from "@/lib/auth/guards";
import { parseYearMonthSearchParams } from "@/lib/daily-workers/period";
import { CompensationInfoTable } from "@/components/compensation-info/compensation-info-table";
import { listCompensationInfos } from "@/modules/compensation-info/actions";

export const metadata: Metadata = {
  title: "상세급여 정보",
};

export default async function ClientCompensationInfoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireAuth("CLIENT_ADMIN");
  const companyId = session.user.companyId;

  if (!companyId) {
    return <p className="text-muted-foreground">소속 회사 정보가 없습니다.</p>;
  }

  const query = await searchParams;
  const { year, month } = parseYearMonthSearchParams(query);

  const compensationInfos = await listCompensationInfos(companyId, year, month);
  const infoRows = compensationInfos.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
  }));

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">상세급여 정보</h1>
        <p className="mt-1 text-muted-foreground">
          월별 상세급여 정보를 확인하고 관리합니다.
        </p>
      </div>

      <CompensationInfoTable
        compensationInfos={infoRows}
        year={year}
        month={month}
        companyId={companyId}
      />
    </div>
  );
}

