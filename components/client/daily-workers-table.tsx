import { CalendarDays } from "lucide-react";

import { DailyWorkerFormDialog } from "@/components/client/daily-worker-form-dialog";
import { DailyWorkersTableView } from "@/components/daily-workers/daily-workers-table-view";
import { DailyWorkersMonthSelector } from "@/components/daily-workers/daily-workers-month-selector";
import { EmptyState } from "@/components/dashboard/empty-state";
import type { DailyWorkerTableRow } from "@/lib/daily-workers/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type DailyWorkersTableProps = {
  dailyWorkers: DailyWorkerTableRow[];
  year: number;
  month: number;
  companyId?: string;
  basePath?: string;
};

export function DailyWorkersTable({
  dailyWorkers,
  year,
  month,
  companyId,
  basePath = "/client/daily-workers",
}: DailyWorkersTableProps) {
  return (
    <Card className="min-w-0">
      <CardHeader className="flex shrink-0 flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="size-4 text-primary" />
            일용직 목록
          </CardTitle>
          <CardDescription>
            {year}년 {month}월 일용직 근로시간과 임금 정보를 관리합니다.
          </CardDescription>
        </div>
        <DailyWorkerFormDialog
          mode="create"
          year={year}
          month={month}
          companyId={companyId}
        />
      </CardHeader>
      <CardContent className="min-w-0">
        {dailyWorkers.length === 0 ? (
          <div className="space-y-4">
            <DailyWorkersMonthSelector year={year} month={month} basePath={basePath} />
            <EmptyState message="등록된 일용직이 없습니다. 일용직 등록 버튼으로 첫 항목을 추가해 주세요." />
          </div>
        ) : (
          <DailyWorkersTableView
            dailyWorkers={dailyWorkers}
            year={year}
            month={month}
            companyId={companyId}
            basePath={basePath}
          />
        )}
      </CardContent>
    </Card>
  );
}
