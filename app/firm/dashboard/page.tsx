import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";

export const metadata: Metadata = {
  title: "대시보드",
};

import { requireAuth } from "@/lib/auth/guards";
import { RecentActivityTable } from "@/components/dashboard/recent-activity-table";
import { getFirmDashboardData } from "@/modules/dashboard/firm";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/dashboard/empty-state";
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

      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard title="고객사 수" value={`${data.companyCount}개`} />
          <StatCard
            title="고객 계정 수"
            value={`${data.clientAccountCount}개`}
          />
          <StatCard
            title="최근 7일 활동"
            value={`${data.recentActivityCount}건`}
            description="전체 고객사 인사 데이터 합계"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="opacity-60 lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="size-5" />
              사무실 업무 관리
              </CardTitle>
              <CardDescription>사무소 직원용 할 일 관리</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">준비 중</Badge>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>최근 활동</CardTitle>
              <CardDescription>
                전체 고객사의 최근 등록 내역입니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.recentActivity.length === 0 ? (
                <EmptyState message="최근 활동 내역이 없습니다." />
              ) : (
                <RecentActivityTable
                  rows={data.recentActivity}
                  showCompany
                  linkMode="firm"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
