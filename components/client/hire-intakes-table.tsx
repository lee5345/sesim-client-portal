import { UserPlus } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { HireIntakeFormDialog } from "@/components/client/hire-intake-form-dialog";
import { HireIntakesTableView } from "@/components/hire-intakes/hire-intakes-table-view";
import type { HireIntakeTableRow } from "@/components/hire-intakes/hire-intakes-data-table";

type DepartmentOption = {
  id: string;
  name: string;
};

type HireIntakesTableProps = {
  hireIntakes: HireIntakeTableRow[];
  departments: DepartmentOption[];
  companyId?: string;
};

export function HireIntakesTable({
  hireIntakes,
  departments,
  companyId,
}: HireIntakesTableProps) {
  return (
    <Card className="min-w-0">
      <CardHeader className="flex shrink-0 flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="size-4 text-primary" />
            입사자 목록
          </CardTitle>
          <CardDescription>등록된 입사자 정보를 확인하고 관리합니다.</CardDescription>
        </div>
        <HireIntakeFormDialog
          mode="create"
          departments={departments}
          companyId={companyId}
        />
      </CardHeader>
      <CardContent className="min-w-0">
        {hireIntakes.length === 0 ? (
          <EmptyState message="등록된 입사자가 없습니다. 입사자 등록 버튼으로 첫 항목을 추가해 주세요." />
        ) : (
          <HireIntakesTableView
            hireIntakes={hireIntakes}
            departments={departments}
            companyId={companyId}
          />
        )}
      </CardContent>
    </Card>
  );
}
