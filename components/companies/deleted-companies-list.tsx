"use client";

import { NO_BUSINESS_NUMBER_LABEL } from "@/lib/companies/labels";
import { formatBusinessNumber } from "@/lib/format/business-number";
import { formatDateTime } from "@/lib/format/date";
import {
  permanentlyDeleteCompanyAction,
  restoreCompanyAction,
} from "@/modules/companies/companies";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { EmptyState } from "@/components/dashboard/empty-state";

type DeletedCompany = {
  id: string;
  name: string;
  businessNumber: string | null;
  deletedAt: Date | null;
};

type DeletedCompaniesListProps = {
  companies: DeletedCompany[];
  canManage: boolean;
};

export function DeletedCompaniesList({
  companies,
  canManage,
}: DeletedCompaniesListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>삭제된 고객사</CardTitle>
        <CardDescription>
          최근 삭제된 고객사 목록입니다. 관리자는 복구하거나 영구 삭제할 수
          있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {companies.length === 0 ? (
          <EmptyState message="최근 삭제된 고객사가 없습니다." />
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="px-4 py-3 font-medium">회사명</th>
                  <th className="px-4 py-3 font-medium">사업자등록번호</th>
                  <th className="px-4 py-3 font-medium">삭제일</th>
                  {canManage ? (
                    <th className="px-4 py-3 text-right font-medium">관리</th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr
                    key={company.id}
                    className="border-b last:border-0 hover:bg-muted/20"
                  >
                    <td className="px-4 py-3 font-medium">{company.name}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">
                      {formatBusinessNumber(company.businessNumber) ??
                        NO_BUSINESS_NUMBER_LABEL}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {company.deletedAt
                        ? formatDateTime(company.deletedAt)
                        : "—"}
                    </td>
                    {canManage ? (
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <form action={restoreCompanyAction}>
                            <input
                              type="hidden"
                              name="companyId"
                              value={company.id}
                            />
                            <Button type="submit" variant="outline" size="sm">
                              복구
                            </Button>
                          </form>
                          <ConfirmDeleteDialog
                            title="고객사 영구 삭제"
                            description={`"${company.name}" 고객사를 영구 삭제하시겠습니까? 연결된 입사·퇴사·급여 데이터와 클라이언트 계정이 모두 삭제되며 복구할 수 없습니다.`}
                            action={permanentlyDeleteCompanyAction}
                            hiddenFields={{ companyId: company.id }}
                            triggerLabel="영구 삭제"
                            confirmLabel="영구 삭제 확인"
                          />
                        </div>
                      </td>
                    ) : null}
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
