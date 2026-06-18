import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireAuth } from "@/lib/auth/guards";
import {
  EMPTY_FIELD_LABEL,
  NO_WORKPLACE_MANAGEMENT_NUMBER_LABEL,
} from "@/lib/companies/labels";
import { formatWorkplaceManagementNumber } from "@/lib/format/workplace-management-number";
import { getCompanyById } from "@/modules/companies/companies";
import { listFirmStaffUsers } from "@/modules/auth/staff-users";
import {
  listCompanyNewHires,
  listCompanyTerminations,
} from "@/modules/companies/company-activity";
import { listDepartments } from "@/modules/companies/departments";
import { CompanyEditForm } from "@/components/companies/company-edit-form";
import { CompanyInfoLink } from "@/components/companies/company-info-link";
import { DepartmentManager } from "@/components/companies/department-manager";
import { EmptyState } from "@/components/dashboard/empty-state";
import { HireIntakesTable } from "@/components/client/hire-intakes-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate, formatDateTime } from "@/lib/format/date";

export default async function FirmCompanyDetailPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const session = await requireAuth(["FIRM_STAFF", "FIRM_ADMIN"]);
  const { companyId } = await params;

  const [company, newHires, terminations, departments, staffUsers] = await Promise.all([
    getCompanyById(companyId),
    listCompanyNewHires(companyId),
    listCompanyTerminations(companyId),
    listDepartments(companyId),
    listFirmStaffUsers(),
  ]);
  if (!company) {
    notFound();
  }

  const newHireCount = company._count.newHires;
  const terminationCount = company._count.terminations;
  const compensationCount = company._count.compensationChanges;
  const canDelete = session.user.role === "FIRM_ADMIN";

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col gap-4">
        <Button
          nativeButton={false}
          variant="ghost"
          size="sm"
          className="w-fit gap-1 px-0 text-muted-foreground hover:text-foreground"
          render={<Link href="/firm/companies" />}
        >
          <ArrowLeft className="size-4" />
          고객사 목록
        </Button>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{company.name}</h1>
          <Badge variant={company.isActive ? "default" : "secondary"}>
            {company.isActive ? "활성" : "비활성"}
          </Badge>
          <div className="flex items-center gap-2">
            <CompanyInfoLink companyId={company.id} />
            <CompanyEditForm
              company={{
                id: company.id,
                name: company.name,
                workplaceManagementNumber: company.workplaceManagementNumber,
                firmContactName: company.firmContactName,
                isActive: company.isActive,
              }}
              staffUsers={staffUsers.map((user) => ({
                id: user.id,
                name: user.name,
                isActive: user.isActive,
              }))}
              canDelete={canDelete}
            />
          </div>
        </div>
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>
            담당 직원: {company.firmContactName ?? EMPTY_FIELD_LABEL}
          </p>
          <p className="font-mono">
            사업장관리번호:{" "}
            {formatWorkplaceManagementNumber(company.workplaceManagementNumber) ??
              NO_WORKPLACE_MANAGEMENT_NUMBER_LABEL}
          </p>
        </div>
      </div>

      <Tabs defaultValue="new-hires">
        <TabsList>
          <TabsTrigger value="new-hires">
            입사자 정보
            <Badge variant="secondary" className="ml-2">
              {newHireCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="terminations">
            퇴사자 정보
            <Badge variant="secondary" className="ml-2">
              {terminationCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="compensation">
            급여 정보
            <Badge variant="secondary" className="ml-2">
              {compensationCount}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new-hires" className="space-y-4">
          <DepartmentManager departments={departments} companyId={companyId} />
          <HireIntakesTable
            hireIntakes={newHires}
            departments={departments}
            companyId={companyId}
          />
        </TabsContent>

        <TabsContent value="terminations">
          <Card>
            <CardHeader>
              <CardTitle>퇴사자 정보</CardTitle>
              <CardDescription>
                {company.name}의 퇴사자 데이터입니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {terminations.length === 0 ? (
                <EmptyState message="등록된 퇴사자 정보가 없습니다." />
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50 text-left">
                        <th className="px-4 py-3 font-medium">이름</th>
                        <th className="px-4 py-3 font-medium">퇴사일</th>
                        <th className="px-4 py-3 font-medium">사유</th>
                        <th className="px-4 py-3 font-medium">등록일</th>
                      </tr>
                    </thead>
                    <tbody>
                      {terminations.map((row) => (
                        <tr key={row.id} className="border-b last:border-0">
                          <td className="px-4 py-3">{row.name}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatDate(row.terminationDate)}
                          </td>
                          <td className="px-4 py-3">{row.reason ?? "-"}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatDateTime(row.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compensation">
          <Card>
            <CardHeader>
              <CardTitle>급여 정보</CardTitle>
              <CardDescription>급여변경 내역 관리</CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState message="준비 중입니다." />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
