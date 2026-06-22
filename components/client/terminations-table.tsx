import { UserMinus } from "lucide-react";

import { TerminationFormDialog } from "@/components/client/termination-form-dialog";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  TerminationsTableView,
} from "@/components/terminations/terminations-table-view";
import type { TerminationTableRow } from "@/lib/terminations/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type TerminationsTableProps = {
  terminations: TerminationTableRow[];
  companyId?: string;
};

export function TerminationsTable({
  terminations,
  companyId,
}: TerminationsTableProps) {
  return (
    <Card className="min-w-0">
      <CardHeader className="flex shrink-0 flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserMinus className="size-4 text-primary" />
            퇴사자 목록
          </CardTitle>
          <CardDescription>등록된 퇴사자 정보를 확인하고 관리합니다.</CardDescription>
        </div>
        <TerminationFormDialog mode="create" companyId={companyId} />
      </CardHeader>
      <CardContent className="min-w-0">
        {terminations.length === 0 ? (
          <EmptyState message="등록된 퇴사자가 없습니다. 퇴사자 등록 버튼으로 첫 항목을 추가해 주세요." />
        ) : (
          <TerminationsTableView
            terminations={terminations}
            companyId={companyId}
          />
        )}
      </CardContent>
    </Card>
  );
}
