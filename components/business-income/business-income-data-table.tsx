import type { ReactNode } from "react";

import {
  MaskedRrnCell,
  MaskedRrnColumnHeader,
  MaskedRrnProvider,
} from "@/components/client/masked-rrn-cell";
import { CompactDateTime } from "@/components/ui/compact-datetime";
import { formatSalaryAmount } from "@/lib/format/currency";
import type { BusinessIncomeTableRow } from "@/lib/business-income/types";
import { SALARY_BASIS_LABELS } from "@/modules/hire-intakes/labels";
import { revealBusinessIncomeRrns } from "@/modules/business-income/actions";

export type { BusinessIncomeTableRow };

const EMPTY_CELL = "—";

const headerCellClassName =
  "border-r border-border/30 px-4 py-3 font-medium whitespace-nowrap last:border-r-0";
const bodyCellClassName =
  "border-r border-border/30 px-4 py-3 whitespace-nowrap last:border-r-0";
const stickyNameHeaderClassName =
  "sticky left-0 z-40 border-r border-border bg-muted px-4 py-3 text-left font-medium whitespace-nowrap shadow-[10px_0_20px_-10px_rgba(0,0,0,0.15)]";
const stickyNameCellClassName =
  "sticky left-0 z-30 border-r border-border bg-muted px-4 py-3 whitespace-nowrap shadow-[10px_0_20px_-10px_rgba(0,0,0,0.12)] group-hover:bg-muted";
const stickyActionHeaderClassName =
  "sticky right-0 z-30 border-l border-border bg-muted px-4 py-3 text-center font-medium whitespace-nowrap shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.15)]";
const stickyActionCellClassName =
  "sticky right-0 z-20 border-l border-border bg-muted px-4 py-3 text-center whitespace-nowrap shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.12)] group-hover:bg-muted";

type BusinessIncomeDataTableProps = {
  businessIncomes: BusinessIncomeTableRow[];
  companyId?: string;
  renderActions?: (businessIncome: BusinessIncomeTableRow) => ReactNode;
};

function displayText(value: string | null | undefined) {
  return value?.trim() ? value : EMPTY_CELL;
}

export function BusinessIncomeDataTable({
  businessIncomes,
  companyId,
  renderActions,
}: BusinessIncomeDataTableProps) {
  const showActions = Boolean(renderActions);

  return (
    <MaskedRrnProvider
      entries={businessIncomes.map((row) => ({ id: row.id }))}
      companyId={companyId}
      revealBulkFn={revealBusinessIncomeRrns}
    >
      <div className="max-w-full min-w-0 overflow-x-auto">
        <table className="w-max min-w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className={stickyNameHeaderClassName}>이름</th>
              <th className={headerCellClassName}>
                <MaskedRrnColumnHeader />
              </th>
              <th className={headerCellClassName}>소득액</th>
              <th className={headerCellClassName}>비고</th>
              <th className={headerCellClassName}>등록자</th>
              <th className={headerCellClassName}>등록일</th>
              {showActions ? (
                <th className={stickyActionHeaderClassName}>관리</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {businessIncomes.map((row) => (
              <tr
                key={row.id}
                className="group border-b last:border-0 hover:bg-muted/20"
              >
                <td className={stickyNameCellClassName}>{row.name}</td>
                <td className={bodyCellClassName}>
                  <MaskedRrnCell id={row.id} maskedRrn={row.maskedRrn} />
                </td>
                <td className={bodyCellClassName}>
                  <div className="flex w-full min-w-28 items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      {SALARY_BASIS_LABELS[row.incomeBasis]}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatSalaryAmount(row.incomeAmount)}
                    </span>
                  </div>
                </td>
                <td
                  className={`${bodyCellClassName} max-w-48 truncate text-muted-foreground`}
                >
                  {displayText(row.notes)}
                </td>
                <td className={`${bodyCellClassName} text-muted-foreground`}>
                  {row.createdByName}
                </td>
                <td className={`${bodyCellClassName} text-muted-foreground`}>
                  <CompactDateTime date={row.createdAt} />
                </td>
                {showActions ? (
                  <td className={stickyActionCellClassName}>
                    <div className="flex items-center justify-center gap-1">
                      {renderActions?.(row)}
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </MaskedRrnProvider>
  );
}
