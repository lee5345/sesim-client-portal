import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "대시보드",
};

import { requireAuth } from "@/lib/auth/guards";
import { CompactDateTime } from "@/components/ui/compact-datetime";
import { getClientDashboardData } from "@/modules/dashboard/client";
import { ActivityTypeBadge } from "@/components/dashboard/activity-type-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
          입사·퇴사 데이터 현황을 확인하고 새 항목을 등록할 수 있습니다.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="총 입사자" value={`${data.newHireCount}건`} />
        <StatCard title="총 퇴사자" value={`${data.terminationCount}건`} />
        <StatCard title="총 일용직" value={`${data.dailyWorkerCount}건`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>최근 제출 내역</CardTitle>
          <CardDescription>최근 등록된 입사·퇴사·일용직 기록입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.recentSubmissions.length === 0 ? (
            <EmptyState message="아직 등록된 내역이 없습니다." />
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    <th className="px-4 py-3 font-medium">이름</th>
                    <th className="px-4 py-3 font-medium">유형</th>
                    <th className="px-4 py-3 font-medium">등록일</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentSubmissions.map((row, i) => (
                    <tr key={`${row.name}-${row.date.toISOString()}-${i}`} className="border-b last:border-0">
                      <td className="px-4 py-3">{row.name}</td>
                      <td className="px-4 py-3">
                        <ActivityTypeBadge type={row.type} />
                      </td>
                      <td className="px-4 py-3">
                        <CompactDateTime date={row.date} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
