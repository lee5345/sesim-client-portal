import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireAuth } from "@/lib/auth/guards";
import {
  EMPTY_FIELD_LABEL,
  NO_WORKPLACE_MANAGEMENT_NUMBER_LABEL,
} from "@/lib/companies/labels";
import { parseYearMonthSearchParams } from "@/lib/daily-workers/period";
import { formatWorkplaceManagementNumber } from "@/lib/format/workplace-management-number";
import { getCompanyById } from "@/modules/companies/companies";
import { listFirmStaffUsers } from "@/modules/auth/staff-users";
import {
  listCompanyDailyWorkers,
  listCompanyNewHires,
  listCompanyTerminations,
} from "@/modules/companies/company-activity";
import { listDepartments } from "@/modules/companies/departments";
import { CompanyEditForm } from "@/components/companies/company-edit-form";
import { CompanyInfoLink } from "@/components/companies/company-info-link";
import { DepartmentManager } from "@/components/companies/department-manager";
import { EmptyState } from "@/components/dashboard/empty-state";
import { CompanyDetailTabs } from "@/components/firm/company-detail-tabs";
import { DailyWorkersTable } from "@/components/client/daily-workers-table";
import { HireIntakesTable } from "@/components/client/hire-intakes-table";
import { TerminationsTable } from "@/components/client/terminations-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ companyId: string }>;
}): Promise<Metadata> {
  const { companyId } = await params;
  const company = await getCompanyById(companyId);

  return {
    title: company?.name ?? "고객사 상세",
  };
}

export default async function FirmCompanyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireAuth(["FIRM_STAFF", "FIRM_ADMIN"]);
  const { companyId } = await params;
  const query = await searchParams;
  const { year, month } = parseYearMonthSearchParams(query);
  const firmDailyWorkersBasePath = `/firm/companies/${companyId}`;

  const [company, newHires, terminations, dailyWorkers, departments, staffUsers] = await Promise.all([
    getCompanyById(companyId),
    listCompanyNewHires(companyId),
    listCompanyTerminations(companyId),
    listCompanyDailyWorkers(companyId, year, month),
    listDepartments(companyId),
    listFirmStaffUsers(),
  ]);
  if (!company) {
    notFound();
  }

  const newHireCount = company._count.newHires;
  const terminationCount = company._count.terminations;
  const dailyWorkerCount = company._count.dailyWorkers;
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

      <CompanyDetailTabs>
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
          <TabsTrigger value="daily-workers">
            일용직 정보
            <Badge variant="secondary" className="ml-2">
              {dailyWorkerCount}
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

        <TabsContent value="terminations" className="space-y-4">
          <TerminationsTable
            terminations={terminations}
            companyId={companyId}
          />
        </TabsContent>

        <TabsContent value="daily-workers" className="space-y-4">
          <DailyWorkersTable
            dailyWorkers={dailyWorkers}
            year={year}
            month={month}
            companyId={companyId}
            basePath={firmDailyWorkersBasePath}
          />
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
      </CompanyDetailTabs>
    </div>
  );
}
