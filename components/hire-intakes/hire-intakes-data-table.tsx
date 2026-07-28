import type { ReactNode } from "react";

import {
  SALARY_BASIS_LABELS,
  SALARY_TYPE_LABELS,
} from "@/modules/hire-intakes/labels";
import { formatSalaryAmount } from "@/lib/format/currency";
import { CompactDateTime } from "@/components/ui/compact-datetime";
import { MultilineText, notesBodyCellClassName } from "@/components/ui/multiline-text";
import { formatDate } from "@/lib/format/date";
import { formatPhone } from "@/lib/format/phone";
import type { NonTaxableAllowance } from "@/lib/validation/hire-intake";
import type { SalaryBasis, SalaryType } from "@/lib/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import {
  MaskedRrnCell,
  MaskedRrnColumnHeader,
  MaskedRrnProvider,
} from "@/components/client/masked-rrn-cell";

const EMPTY_CELL = "—";

const headerCellClassName =
  "border-r border-border/30 px-4 py-3 text-left font-medium whitespace-nowrap last:border-r-0";
const bodyCellClassName =
  "border-r border-border/30 px-4 py-3 align-middle whitespace-nowrap last:border-r-0";
const stickyNameHeaderClassName =
  "sticky left-0 z-40 border-r border-border bg-muted px-4 py-3 text-left font-medium whitespace-nowrap shadow-[10px_0_20px_-10px_rgba(0,0,0,0.15)]";
const stickyNameCellClassName =
  "sticky left-0 z-30 border-r border-border bg-muted px-4 py-3 align-middle text-muted-foreground whitespace-nowrap shadow-[10px_0_20px_-10px_rgba(0,0,0,0.12)] group-hover:bg-muted";
const stickyActionHeaderClassName =
  "sticky right-0 z-30 border-l border-border bg-muted px-4 py-3 text-center font-medium whitespace-nowrap shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.15)]";
const stickyActionCellClassName =
  "sticky right-0 z-20 border-l border-border bg-muted px-4 py-3 text-center align-middle whitespace-nowrap shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.12)] group-hover:bg-muted";

export type HireIntakeTableRow = {
  id: string;
  name: string;
  employeeNumber: string | null;
  email: string | null;
  maskedRrn: string;
  hireDate: Date;
  department: string | null;
  salaryType: SalaryType;
  salaryBasis: SalaryBasis;
  salaryAmount: number;
  isContract: boolean;
  contractStart: Date | null;
  contractEnd: Date | null;
  nonTaxableAllowances: NonTaxableAllowance[] | null;
  bankName: string | null;
  accountNumber: string | null;
  phone: string | null;
  notes: string | null;
  createdAt: Date;
  createdByName: string;
};

type HireIntakesDataTableProps = {
  hireIntakes: HireIntakeTableRow[];
  companyId?: string;
  renderActions?: (hireIntake: HireIntakeTableRow) => ReactNode;
};

function displayText(value: string | null | undefined) {
  return value?.trim() ? value : EMPTY_CELL;
}

function displayDate(date: Date | null | undefined) {
  return date ? formatDate(date) : EMPTY_CELL;
}

function formatNonTaxableAllowances(allowances: NonTaxableAllowance[] | null) {
  if (!allowances?.length) {
    return EMPTY_CELL;
  }

  return allowances
    .map((allowance) => {
      const label =
        allowance.type === "기타" && allowance.customLabel
          ? allowance.customLabel
          : allowance.type;
      return `${label} ${formatSalaryAmount(allowance.amount)}`;
    })
    .join(", ");
}

export function HireIntakesDataTable({
  hireIntakes,
  companyId,
  renderActions,
}: HireIntakesDataTableProps) {
  const showActions = Boolean(renderActions);

  return (
    <MaskedRrnProvider
      entries={hireIntakes.map((hireIntake) => ({ id: hireIntake.id }))}
      companyId={companyId}
    >
      <div className="max-w-full min-w-0 overflow-x-auto">
        <table className="w-max min-w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th rowSpan={2} className={`${stickyNameHeaderClassName} align-middle`}>
                이름
              </th>
              <th rowSpan={2} className={`${headerCellClassName} align-middle`}>
                사번
              </th>
              <th rowSpan={2} className={`${headerCellClassName} align-middle`}>
                <MaskedRrnColumnHeader />
              </th>
              <th rowSpan={2} className={`${headerCellClassName} align-middle`}>
                입사일
              </th>
              <th rowSpan={2} className={`${headerCellClassName} align-middle`}>
                부서
              </th>
              <th rowSpan={2} className={`${headerCellClassName} align-middle`}>
                급여
              </th>
              <th rowSpan={2} className={`${headerCellClassName} align-middle`}>
                고용 형태
              </th>
              <th className={`${headerCellClassName} text-center`} colSpan={2}>
                계약 기간
              </th>
              <th rowSpan={2} className={`${headerCellClassName} align-middle`}>
                비과세 항목
              </th>
              <th className={`${headerCellClassName} text-center`} colSpan={2}>
                급여계좌
              </th>
              <th rowSpan={2} className={`${headerCellClassName} align-middle`}>
                이메일
              </th>
              <th rowSpan={2} className={`${headerCellClassName} align-middle`}>
                연락처
              </th>
              <th rowSpan={2} className={`${headerCellClassName} align-middle`}>
                비고
              </th>
              <th rowSpan={2} className={`${headerCellClassName} align-middle`}>
                등록자
              </th>
              <th rowSpan={2} className={`${headerCellClassName} align-middle`}>
                등록일
              </th>
              {showActions ? (
                <th
                  rowSpan={2}
                  className={`${stickyActionHeaderClassName} align-middle`}
                >
                  관리
                </th>
              ) : null}
            </tr>
            <tr className="border-b bg-muted/20 text-left">
              <th className={headerCellClassName}>시작일</th>
              <th className={headerCellClassName}>종료일</th>
              <th className={headerCellClassName}>은행</th>
              <th className={headerCellClassName}>계좌번호</th>
            </tr>
          </thead>
        <tbody>
          {hireIntakes.map((hireIntake) => (
            <tr
              key={hireIntake.id}
              className="group border-b last:border-0 hover:bg-muted/20"
            >
              <td className={stickyNameCellClassName}>{hireIntake.name}</td>
              <td className={`${bodyCellClassName} font-mono text-muted-foreground`}>
                {displayText(hireIntake.employeeNumber)}
              </td>
              <td className={bodyCellClassName}>
                <MaskedRrnCell
                  id={hireIntake.id}
                  maskedRrn={hireIntake.maskedRrn}
                />
              </td>
              <td className={`${bodyCellClassName} text-muted-foreground`}>
                {formatDate(hireIntake.hireDate)}
              </td>
              <td className={`${bodyCellClassName} text-muted-foreground`}>
                {displayText(hireIntake.department)}
              </td>
              <td className={bodyCellClassName}>
                <div className="space-y-1">
                  <div className="whitespace-nowrap">
                    {SALARY_TYPE_LABELS[hireIntake.salaryType]} ·{" "}
                    {SALARY_BASIS_LABELS[hireIntake.salaryBasis]}
                  </div>
                  <div className="whitespace-nowrap text-muted-foreground">
                    {formatSalaryAmount(hireIntake.salaryAmount)}
                  </div>
                </div>
              </td>
              <td className={bodyCellClassName}>
                {hireIntake.isContract ? (
                  <Badge variant="secondary">계약직</Badge>
                ) : (
                  <Badge variant="outline">정규직</Badge>
                )}
              </td>
              <td className={`${bodyCellClassName} text-muted-foreground`}>
                {hireIntake.isContract
                  ? displayDate(hireIntake.contractStart)
                  : EMPTY_CELL}
              </td>
              <td className={`${bodyCellClassName} text-muted-foreground`}>
                {hireIntake.isContract
                  ? displayDate(hireIntake.contractEnd)
                  : EMPTY_CELL}
              </td>
              <td className={`${bodyCellClassName} text-muted-foreground`}>
                {formatNonTaxableAllowances(hireIntake.nonTaxableAllowances)}
              </td>
              <td className={`${bodyCellClassName} text-muted-foreground`}>
                {displayText(hireIntake.bankName)}
              </td>
              <td className={`${bodyCellClassName} text-muted-foreground`}>
                {displayText(hireIntake.accountNumber)}
              </td>
              <td className={`${bodyCellClassName} text-muted-foreground`}>
                {displayText(hireIntake.email)}
              </td>
              <td className={`${bodyCellClassName} text-muted-foreground`}>
                {hireIntake.phone ? formatPhone(hireIntake.phone) : EMPTY_CELL}
              </td>
              <td className={`${notesBodyCellClassName} text-muted-foreground`}>
                <MultilineText value={hireIntake.notes} />
              </td>
              <td className={bodyCellClassName}>{hireIntake.createdByName}</td>
              <td className={bodyCellClassName}>
                <CompactDateTime date={hireIntake.createdAt} />
              </td>
              {showActions ? (
                <td className={stickyActionCellClassName}>
                  <div className="flex justify-center gap-2 whitespace-nowrap">
                    {renderActions?.(hireIntake)}
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
