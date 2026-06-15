import { UserPlus } from "lucide-react";

import { deleteHireIntakeAction } from "@/modules/hire-intakes/actions";
import {
  SALARY_BASIS_LABELS,
  SALARY_TYPE_LABELS,
} from "@/modules/hire-intakes/labels";
import { formatSalaryAmount } from "@/lib/format/currency";
import { formatDate } from "@/lib/format/date";
import type { SalaryBasis, SalaryType } from "@/lib/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { HireIntakeFormDialog } from "@/components/client/hire-intake-form-dialog";
import { MaskedRrnCell } from "@/components/client/masked-rrn-cell";

type DepartmentOption = {
  id: string;
  name: string;
};

type HireIntakeRow = {
  id: string;
  name: string;
  email: string;
  maskedRrn: string;
  hireDate: Date;
  department: string | null;
  salaryType: SalaryType;
  salaryBasis: SalaryBasis;
  salaryAmount: number;
  isContract: boolean;
  contractStart: Date | null;
  contractEnd: Date | null;
};

type HireIntakesTableProps = {
  hireIntakes: HireIntakeRow[];
  departments: DepartmentOption[];
};

function toFormDateValue(date: Date | null) {
  if (!date) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

export function HireIntakesTable({
  hireIntakes,
  departments,
}: HireIntakesTableProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="size-4 text-primary" />
            입사자 목록
          </CardTitle>
          <CardDescription>등록된 입사자 정보를 확인하고 관리합니다.</CardDescription>
        </div>
        <HireIntakeFormDialog mode="create" departments={departments} />
      </CardHeader>
      <CardContent>
        {hireIntakes.length === 0 ? (
          <EmptyState message="등록된 입사자가 없습니다. 입사자 등록 버튼으로 첫 항목을 추가해 주세요." />
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="px-4 py-3 font-medium">이름</th>
                  <th className="px-4 py-3 font-medium">이메일</th>
                  <th className="px-4 py-3 font-medium">주민등록번호</th>
                  <th className="px-4 py-3 font-medium">입사일</th>
                  <th className="px-4 py-3 font-medium">부서</th>
                  <th className="px-4 py-3 font-medium">급여</th>
                  <th className="px-4 py-3 font-medium">고용 형태</th>
                  <th className="px-4 py-3 text-right font-medium">관리</th>
                </tr>
              </thead>
              <tbody>
                {hireIntakes.map((hireIntake) => (
                  <tr
                    key={hireIntake.id}
                    className="border-b last:border-0 hover:bg-muted/20"
                  >
                    <td className="px-4 py-3 font-medium">{hireIntake.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {hireIntake.email}
                    </td>
                    <td className="px-4 py-3">
                      <MaskedRrnCell
                        id={hireIntake.id}
                        maskedRrn={hireIntake.maskedRrn}
                      />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(hireIntake.hireDate)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {hireIntake.department ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div>
                          {SALARY_TYPE_LABELS[hireIntake.salaryType]} ·{" "}
                          {SALARY_BASIS_LABELS[hireIntake.salaryBasis]}
                        </div>
                        <div className="text-muted-foreground">
                          {formatSalaryAmount(hireIntake.salaryAmount)}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {hireIntake.isContract ? (
                        <div className="space-y-1">
                          <Badge variant="secondary">계약직</Badge>
                          <div className="text-xs text-muted-foreground">
                            {hireIntake.contractStart && hireIntake.contractEnd
                              ? `${formatDate(hireIntake.contractStart)} ~ ${formatDate(hireIntake.contractEnd)}`
                              : "—"}
                          </div>
                        </div>
                      ) : (
                        <Badge variant="outline">정규직</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <HireIntakeFormDialog
                          mode="edit"
                          departments={departments}
                          hireIntake={{
                            id: hireIntake.id,
                            name: hireIntake.name,
                            email: hireIntake.email,
                            hireDate: toFormDateValue(hireIntake.hireDate) ?? "",
                            department: hireIntake.department,
                            salaryType: hireIntake.salaryType,
                            salaryBasis: hireIntake.salaryBasis,
                            salaryAmount: hireIntake.salaryAmount,
                            isContract: hireIntake.isContract,
                            contractStart: toFormDateValue(hireIntake.contractStart),
                            contractEnd: toFormDateValue(hireIntake.contractEnd),
                          }}
                        />
                        <ConfirmDeleteDialog
                          title="입사자 정보 삭제"
                          description={`"${hireIntake.name}" 입사자 정보를 삭제하시겠습니까? 삭제된 항목은 복구할 수 없습니다.`}
                          action={deleteHireIntakeAction}
                          hiddenFields={{ id: hireIntake.id }}
                          triggerLabel="삭제"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
