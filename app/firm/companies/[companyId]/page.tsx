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
import { formatDate } from "@/lib/format/date";
import { formatWorkplaceManagementNumber } from "@/lib/format/workplace-management-number";
import { getCompanyById } from "@/modules/companies/companies";
import { listFirmStaffUsers } from "@/modules/auth/staff-users";
import {
  listCompanyCompensationChanges,
  listCompanyCompensationInfos,
  listCompanyDailyWorkers,
  listCompanyNewHires,
  listCompanyTerminations,
} from "@/modules/companies/company-activity";
import { listDepartments } from "@/modules/companies/departments";
import { CompanyEditForm } from "@/components/companies/company-edit-form";
import { CompanyInfoLink } from "@/components/companies/company-info-link";
import { DepartmentManager } from "@/components/companies/department-manager";
import { CompanyDetailTabs } from "@/components/firm/company-detail-tabs";
import { CompanyTabIndicator } from "@/components/firm/company-tab-indicator";
import { CompensationChangesTable } from "@/components/client/compensation-changes-table";
import { CompensationInfoTable } from "@/components/compensation-info/compensation-info-table";
import { DailyWorkersTable } from "@/components/client/daily-workers-table";
import { HireIntakesTable } from "@/components/client/hire-intakes-table";
import { TerminationsTable } from "@/components/client/terminations-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const isFirmAdmin = session.user.role === "FIRM_ADMIN";

  const [
    company,
    newHires,
    terminations,
    dailyWorkers,
    compensationChanges,
    compensationInfos,
    departments,
    staffUsers,
  ] = await Promise.all([
    getCompanyById(companyId),
    listCompanyNewHires(companyId),
    listCompanyTerminations(companyId),
    listCompanyDailyWorkers(companyId, year, month),
    listCompanyCompensationChanges(companyId),
    listCompanyCompensationInfos(companyId, year, month),
    listDepartments(companyId),
    isFirmAdmin ? listFirmStaffUsers() : Promise.resolve([]),
  ]);
  if (!company) {
    notFound();
  }

  const newHireCount = company._count.newHires;
  const terminationCount = company._count.terminations;
  const dailyWorkerCount = company._count.dailyWorkers;
  const compensationChangeCount = company._count.compensationChanges;
  const compensationInfoCount = company._count.compensationInfos;

  const changeRows = compensationChanges.map((row) => ({
    ...row,
    changeDate: formatDate(row.changeDate),
    createdAt: row.createdAt.toISOString(),
  }));

  const infoRows = compensationInfos.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
  }));

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
            {isFirmAdmin ? (
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
                canDelete
              />
            ) : null}
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

      <CompanyDetailTabs companyId={companyId}>
        <TabsList>
          <TabsTrigger value="new-hires">
            입사자 정보
            <CompanyTabIndicator
              companyId={companyId}
              entityType="NEW_HIRE"
              totalCount={newHireCount}
            />
          </TabsTrigger>
          <TabsTrigger value="terminations">
            퇴사자 정보
            <CompanyTabIndicator
              companyId={companyId}
              entityType="TERMINATION"
              totalCount={terminationCount}
            />
          </TabsTrigger>
          <TabsTrigger value="daily-workers">
            일용직 정보
            <CompanyTabIndicator
              companyId={companyId}
              entityType="DAILY_WORKER"
              totalCount={dailyWorkerCount}
            />
          </TabsTrigger>
          <TabsTrigger value="compensation-changes">
            급여변경 정보
            <CompanyTabIndicator
              companyId={companyId}
              entityType="COMPENSATION_CHANGE"
              totalCount={compensationChangeCount}
            />
          </TabsTrigger>
          <TabsTrigger value="compensation-info">
            상세급여 정보
            <CompanyTabIndicator
              companyId={companyId}
              entityType="COMPENSATION_INFO"
              totalCount={compensationInfoCount}
            />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new-hires" className="space-y-4">
          <DepartmentManager departments={departments} companyId={companyId} />
          <HireIntakesTable
            hireIntakes={newHires}
            departments={departments}
            companyId={companyId}
            companyName={company.name}
          />
        </TabsContent>

        <TabsContent value="terminations" className="space-y-4">
          <TerminationsTable
            terminations={terminations}
            companyId={companyId}
            companyName={company.name}
          />
        </TabsContent>

        <TabsContent value="daily-workers" className="space-y-4">
          <DailyWorkersTable
            dailyWorkers={dailyWorkers}
            year={year}
            month={month}
            companyId={companyId}
            companyName={company.name}
            basePath={firmDailyWorkersBasePath}
          />
        </TabsContent>

        <TabsContent value="compensation-changes" className="space-y-4">
          <CompensationChangesTable
            compensationChanges={changeRows}
            companyId={companyId}
            companyName={company.name}
          />
        </TabsContent>

        <TabsContent value="compensation-info" className="space-y-4">
          <CompensationInfoTable
            compensationInfos={infoRows}
            year={year}
            month={month}
            companyId={companyId}
            companyName={company.name}
            basePath={firmDailyWorkersBasePath}
          />
        </TabsContent>
      </CompanyDetailTabs>
    </div>
  );
}
