import type { Metadata } from "next";

import { requireAuth } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "일용직 정보",
};
import { parseYearMonthSearchParams } from "@/lib/daily-workers/period";
import { DailyWorkersTable } from "@/components/client/daily-workers-table";
import { listDailyWorkers } from "@/modules/daily-workers/actions";

export default async function ClientDailyWorkersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireAuth("CLIENT_ADMIN");
  const companyId = session.user.companyId;
  const params = await searchParams;
  const { year, month } = parseYearMonthSearchParams(params);

  if (!companyId) {
    return <p className="text-muted-foreground">소속 회사 정보가 없습니다.</p>;
  }

  const dailyWorkers = await listDailyWorkers(companyId, year, month);

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">일용직 정보</h1>
        <p className="mt-1 text-muted-foreground">
          월별 일용직 근로시간과 임금 정보를 등록하고 관리합니다.
        </p>
      </div>

      <DailyWorkersTable dailyWorkers={dailyWorkers} year={year} month={month} />
    </div>
  );
}
