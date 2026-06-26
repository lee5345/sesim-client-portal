import type { ReactNode } from "react";

import { MaskedRrnCell } from "@/components/client/masked-rrn-cell";
import { Badge } from "@/components/ui/badge";
import { CompactDateTime } from "@/components/ui/compact-datetime";
import {
  formatDailyHourDayLabel,
  formatDailyHours,
  getDailyHourDayNumbers,
} from "@/lib/daily-workers/calculations";
import { formatSalaryAmount } from "@/lib/format/currency";
import type { DailyWorkerTableRow } from "@/lib/daily-workers/types";
import { SALARY_BASIS_LABELS } from "@/modules/hire-intakes/labels";
import { DAILY_WORKER_OCCUPATION_LABELS } from "@/modules/daily-workers/constants";
import { revealDailyWorkerRRN } from "@/modules/daily-workers/actions";

export type { DailyWorkerTableRow };

const EMPTY_CELL = "—";

const headerCellClassName =
  "border-r border-border/30 px-4 py-3 font-medium whitespace-nowrap last:border-r-0";
const bodyCellClassName =
  "border-r border-border/30 px-4 py-3 whitespace-nowrap last:border-r-0";
const autoCellClassName = `${bodyCellClassName} bg-muted/60 text-muted-foreground`;
const dayHeaderClassName =
  "border-r border-border/30 px-4 py-3 text-center font-medium whitespace-nowrap last:border-r-0";
const dayCellClassName =
  "border-r border-border/30 px-4 py-3 text-center font-mono whitespace-nowrap last:border-r-0";
const stickyNameHeaderClassName =
  "sticky left-0 z-40 border-r border-border bg-muted px-4 py-3 font-medium whitespace-nowrap shadow-[10px_0_20px_-10px_rgba(0,0,0,0.15)]";
const stickyNameCellClassName =
  "sticky left-0 z-30 border-r border-border bg-muted px-4 py-3 text-muted-foreground whitespace-nowrap shadow-[10px_0_20px_-10px_rgba(0,0,0,0.12)] group-hover:bg-muted";
const stickyActionHeaderClassName =
  "sticky right-0 z-30 border-l border-border bg-muted px-4 py-3 text-center font-medium whitespace-nowrap shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.15)]";
const stickyActionCellClassName =
  "sticky right-0 z-20 border-l border-border bg-muted px-4 py-3 text-center whitespace-nowrap shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.12)] group-hover:bg-muted";

type DailyWorkersDataTableProps = {
  dailyWorkers: DailyWorkerTableRow[];
  year: number;
  month: number;
  companyId?: string;
  renderActions?: (dailyWorker: DailyWorkerTableRow) => ReactNode;
};

function displayText(value: string | null | undefined) {
  return value?.trim() ? value : EMPTY_CELL;
}

export function DailyWorkersDataTable({
  dailyWorkers,
  year,
  month,
  companyId,
  renderActions,
}: DailyWorkersDataTableProps) {
  const showActions = Boolean(renderActions);
  const dayNumbers = getDailyHourDayNumbers();

  return (
    <div className="max-w-full min-w-0 overflow-x-auto">
      <table className="w-max min-w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-left">
            <th className={stickyNameHeaderClassName}>이름</th>
            <th className={headerCellClassName}>주민등록번호</th>
            <th className={headerCellClassName}>직종</th>
            <th className={headerCellClassName}>직종코드</th>
            {dayNumbers.map((day) => (
              <th key={day} className={dayHeaderClassName}>
                {formatDailyHourDayLabel(day)}
              </th>
            ))}
            <th className={`${headerCellClassName} bg-muted/60`}>근로일수</th>
            <th className={`${headerCellClassName} bg-muted/60`}>일평균 근로시간</th>
            <th className={headerCellClassName}>기준</th>
            <th className={headerCellClassName}>임금총액</th>
            <th className={headerCellClassName}>비고</th>
            <th className={headerCellClassName}>등록자</th>
            <th className={headerCellClassName}>등록일</th>
            {showActions ? (
              <th className={stickyActionHeaderClassName}>관리</th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {dailyWorkers.map((dailyWorker) => (
            <tr
              key={dailyWorker.id}
              className="group border-b last:border-0 hover:bg-muted/20"
            >
              <td className={stickyNameCellClassName}>{dailyWorker.name}</td>
              <td className={bodyCellClassName}>
                <MaskedRrnCell
                  id={dailyWorker.id}
                  maskedRrn={dailyWorker.maskedRrn}
                  companyId={companyId}
                  revealFn={revealDailyWorkerRRN}
                />
              </td>
              <td className={`${bodyCellClassName} max-w-40 truncate`}>
                {DAILY_WORKER_OCCUPATION_LABELS[dailyWorker.occupation]}
              </td>
              <td className={autoCellClassName}>
                <Badge variant="secondary">{dailyWorker.occupationCode}</Badge>
              </td>
              {dayNumbers.map((day) => {
                const fieldName = `hoursDay${day}` as const;
                const value = dailyWorker.hours[fieldName];
                return (
                  <td key={day} className={dayCellClassName}>
                    {value === null ? "—" : formatDailyHours(value)}
                  </td>
                );
              })}
              <td className={autoCellClassName}>{dailyWorker.daysWorked}</td>
              <td className={autoCellClassName}>{dailyWorker.avgHoursPerDay}</td>
              <td className={bodyCellClassName}>
                {SALARY_BASIS_LABELS[dailyWorker.salaryBasis]}
              </td>
              <td className={bodyCellClassName}>
                {formatSalaryAmount(dailyWorker.totalWage)}
              </td>
              <td className={`${bodyCellClassName} text-muted-foreground`}>
                {displayText(dailyWorker.notes)}
              </td>
              <td className={bodyCellClassName}>{dailyWorker.createdByName}</td>
              <td className={bodyCellClassName}>
                <CompactDateTime date={dailyWorker.createdAt} />
              </td>
              {showActions ? (
                <td className={stickyActionCellClassName}>
                  <div className="flex justify-center gap-2 whitespace-nowrap">
                    {renderActions?.(dailyWorker)}
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
