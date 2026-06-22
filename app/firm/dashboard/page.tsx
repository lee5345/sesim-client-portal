import Link from "next/link";
import { Calculator } from "lucide-react";

import { requireAuth } from "@/lib/auth/guards";
import { CompactDateTime } from "@/components/ui/compact-datetime";
import { getFirmDashboardData } from "@/modules/dashboard/firm";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function FirmDashboardPage() {
  await requireAuth(["FIRM_STAFF", "FIRM_ADMIN"]);

  const data = await getFirmDashboardData();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">대시보드</h1>
        <p className="mt-1 text-muted-foreground">
          전체 고객사 현황과 최근 활동을 확인합니다.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="고객사 수" value={`${data.companyCount}개`} />
        <StatCard
          title="가입 신청 대기"
          value={`${data.pendingRequestCount}건`}
          action={
            data.pendingRequestCount > 0 ? (
              <Button
                nativeButton={false}
                variant="link"
                size="sm"
                className="h-auto p-0"
                render={<Link href="/firm/client-accounts" />}
              >
                보기
              </Button>
            ) : null
          }
        />
        <StatCard
          title="최근 7일 활동"
          value={`${data.recentActivityCount}건`}
          description="입사·퇴사 등록 합계"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="opacity-60 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="size-5" />
              사대보험 계산기
            </CardTitle>
            <CardDescription>4대보험료 계산 도구</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">준비 중</Badge>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>최근 활동</CardTitle>
            <CardDescription>
              전체 고객사의 최근 입사·퇴사 등록 내역입니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentActivity.length === 0 ? (
              <EmptyState message="최근 활동 내역이 없습니다." />
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 text-left">
                      <th className="px-4 py-3 font-medium">이름</th>
                      <th className="px-4 py-3 font-medium">고객사</th>
                      <th className="px-4 py-3 font-medium">유형</th>
                      <th className="px-4 py-3 font-medium">등록일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentActivity.map((row, i) => (
                      <tr
                        key={`${row.name}-${row.date.toISOString()}-${i}`}
                        className="border-b last:border-0"
                      >
                        <td className="px-4 py-3">{row.name}</td>
                        <td className="px-4 py-3">{row.companyName}</td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary">{row.type}</Badge>
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
    </div>
  );
}
