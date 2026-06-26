import type { ReactNode } from "react";

import { MaskedRrnCell } from "@/components/client/masked-rrn-cell";
import { RetirementPayTypeIndicator } from "@/components/terminations/retirement-pay-type-indicator";
import { CompactDateTime } from "@/components/ui/compact-datetime";
import { formatDate } from "@/lib/format/date";
import type { TerminationTableRow } from "@/lib/terminations/types";
import { revealTerminationRRN } from "@/modules/terminations/actions";

export type { TerminationTableRow };

const EMPTY_CELL = "—";

const headerCellClassName =
  "border-r border-border/30 px-4 py-3 font-medium whitespace-nowrap last:border-r-0";
const bodyCellClassName =
  "border-r border-border/30 px-4 py-3 whitespace-nowrap last:border-r-0";
const stickyNameHeaderClassName =
  "sticky left-0 z-40 border-r border-border bg-muted px-4 py-3 font-medium whitespace-nowrap shadow-[10px_0_20px_-10px_rgba(0,0,0,0.15)]";
const stickyNameCellClassName =
  "sticky left-0 z-30 border-r border-border bg-muted px-4 py-3 text-muted-foreground whitespace-nowrap shadow-[10px_0_20px_-10px_rgba(0,0,0,0.12)] group-hover:bg-muted";
const stickyActionHeaderClassName =
  "sticky right-0 z-30 border-l border-border bg-muted px-4 py-3 text-center font-medium whitespace-nowrap shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.15)]";
const stickyActionCellClassName =
  "sticky right-0 z-20 border-l border-border bg-muted px-4 py-3 text-center whitespace-nowrap shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.12)] group-hover:bg-muted";

type TerminationsDataTableProps = {
  terminations: TerminationTableRow[];
  companyId?: string;
  renderActions?: (termination: TerminationTableRow) => ReactNode;
};

function displayText(value: string | null | undefined) {
  return value?.trim() ? value : EMPTY_CELL;
}

export function TerminationsDataTable({
  terminations,
  companyId,
  renderActions,
}: TerminationsDataTableProps) {
  const showActions = Boolean(renderActions);

  return (
    <div className="max-w-full min-w-0 overflow-x-auto">
      <table className="w-max min-w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-left">
            <th className={stickyNameHeaderClassName}>이름</th>
            <th className={headerCellClassName}>주민등록번호</th>
            <th className={headerCellClassName}>입사일</th>
            <th className={headerCellClassName}>퇴사일</th>
            <th className={headerCellClassName}>퇴사 사유</th>
            <th className={headerCellClassName}>퇴직 급여</th>
            <th className={headerCellClassName}>비고</th>
            <th className={headerCellClassName}>등록자</th>
            <th className={headerCellClassName}>등록일</th>
            {showActions ? (
              <th className={stickyActionHeaderClassName}>관리</th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {terminations.map((termination) => (
            <tr
              key={termination.id}
              className="group border-b last:border-0 hover:bg-muted/20"
            >
              <td className={stickyNameCellClassName}>{termination.name}</td>
              <td className={bodyCellClassName}>
                <MaskedRrnCell
                  id={termination.id}
                  maskedRrn={termination.maskedRrn}
                  companyId={companyId}
                  revealFn={revealTerminationRRN}
                />
              </td>
              <td className={`${bodyCellClassName} text-muted-foreground`}>
                {termination.hireDate ? formatDate(termination.hireDate) : EMPTY_CELL}
              </td>
              <td className={`${bodyCellClassName} text-muted-foreground`}>
                {formatDate(termination.terminationDate)}
              </td>
              <td className={`${bodyCellClassName} text-muted-foreground`}>
                {displayText(termination.reason)}
              </td>
              <td className={bodyCellClassName}>
                <RetirementPayTypeIndicator type={termination.retirementPayType} />
              </td>
              <td className={`${bodyCellClassName} text-muted-foreground`}>
                {displayText(termination.notes)}
              </td>
              <td className={bodyCellClassName}>{termination.createdByName}</td>
              <td className={bodyCellClassName}>
                <CompactDateTime date={termination.createdAt} />
              </td>
              {showActions ? (
                <td className={stickyActionCellClassName}>
                  <div className="flex justify-center gap-2 whitespace-nowrap">
                    {renderActions?.(termination)}
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
