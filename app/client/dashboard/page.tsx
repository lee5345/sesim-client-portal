import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "대시보드",
};

import { requireAuth } from "@/lib/auth/guards";
import { RecentActivityTable } from "@/components/dashboard/recent-activity-table";
import { getClientDashboardData } from "@/modules/dashboard/client";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function formatLatestPeriodDescription(
  period: { year: number; month: number } | null,
) {
  if (!period) {
    return undefined;
  }

  return `최근 등록: ${period.year}년 ${period.month}월 기준 누적`;
}

export default async function ClientDashboardPage() {
  const session = await requireAuth("CLIENT_ADMIN");
  const companyId = session.user.companyId;

  if (!companyId) {
    return <p className="text-muted-foreground">소속 회사 정보가 없습니다.</p>;
  }

  const data = await getClientDashboardData(companyId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {data.companyName} 대시보드
        </h1>
        <p className="mt-1 text-muted-foreground">
          환영합니다, 컨설팅 포털을 통해 편리하게 인사 데이터 현황을 확인하고 관리하세요.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard title="총 입사자" value={`${data.newHireCount}건`} />
          <StatCard title="총 퇴사자" value={`${data.terminationCount}건`} />
          <StatCard
            title="총 일용직"
            value={`${data.dailyWorkerCount}건`}
            description={formatLatestPeriodDescription(
              data.latestDailyWorkerPeriod,
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard title="총 급여변경" value={`${data.compensationChangeCount}건`} />
          <StatCard
            title="총 상세급여"
            value={`${data.compensationInfoCount}건`}
            description={formatLatestPeriodDescription(
              data.latestCompensationInfoPeriod,
            )}
          />
          <StatCard
            title="총 사업소득"
            value={`${data.businessIncomeCount}건`}
            description={formatLatestPeriodDescription(
              data.latestBusinessIncomePeriod,
            )}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>최근 제출 내역</CardTitle>
            <CardDescription>최근 등록된 인사 데이터 활동 기록입니다.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentSubmissions.length === 0 ? (
              <EmptyState message="아직 등록된 내역이 없습니다." />
            ) : (
              <RecentActivityTable rows={data.recentSubmissions} linkMode="client" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
