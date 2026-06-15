import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireAuth } from "@/lib/auth/guards";
import { formatDate, formatDateTime } from "@/lib/format/date";
import { NO_BUSINESS_NUMBER_LABEL } from "@/lib/companies/labels";
import { formatBusinessNumber } from "@/lib/format/business-number";
import { getCompanyById } from "@/modules/companies/companies";
import {
  listCompanyNewHires,
  listCompanyTerminations,
  revealCompanyNewHireRrn,
} from "@/modules/companies/company-activity";
import {
  SALARY_BASIS_LABELS,
  SALARY_TYPE_LABELS,
} from "@/modules/hire-intakes/labels";
import { CompanyEditForm } from "@/components/companies/company-edit-form";
import { CompanyInfoLink } from "@/components/companies/company-info-link";
import { EmptyState } from "@/components/dashboard/empty-state";
import { MaskedRrnCell } from "@/components/client/masked-rrn-cell";
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

import { formatSalaryAmount } from "@/lib/format/currency";

export default async function FirmCompanyDetailPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const session = await requireAuth(["FIRM_STAFF", "FIRM_ADMIN"]);
  const { companyId } = await params;

  const [company, newHires, terminations] = await Promise.all([
    getCompanyById(companyId),
    listCompanyNewHires(companyId),
    listCompanyTerminations(companyId),
  ]);
  if (!company) {
    notFound();
  }

  const newHireCount = company._count.newHires;
  const terminationCount = company._count.terminations;
  const compensationCount = company._count.compensationChanges;
  const canDelete = session.user.role === "FIRM_ADMIN";

  return (
    <div className="space-y-6">
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
                businessNumber: company.businessNumber,
                isActive: company.isActive,
              }}
              canDelete={canDelete}
            />
          </div>
        </div>
        <p className="font-mono text-sm text-muted-foreground">
          사업자등록번호:{" "}
          {formatBusinessNumber(company.businessNumber) ?? NO_BUSINESS_NUMBER_LABEL}
        </p>
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

        <TabsContent value="new-hires">
          <Card>
            <CardHeader>
              <CardTitle>입사자 정보</CardTitle>
              <CardDescription>
                {company.name}의 입사자 데이터입니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {newHires.length === 0 ? (
                <EmptyState message="등록된 입사자 정보가 없습니다." />
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50 text-left">
                        <th className="px-4 py-3 font-medium">이름</th>
                        <th className="px-4 py-3 font-medium">이메일</th>
                        <th className="px-4 py-3 font-medium">주민등록번호</th>
                        <th className="px-4 py-3 font-medium">입사일</th>
                        <th className="px-4 py-3 font-medium">부서</th>
                        <th className="px-4 py-3 font-medium">급여</th>
                        <th className="px-4 py-3 font-medium">고용 형태</th>
                        <th className="px-4 py-3 font-medium">등록일</th>
                      </tr>
                    </thead>
                    <tbody>
                      {newHires.map((row) => (
                        <tr key={row.id} className="border-b last:border-0">
                          <td className="px-4 py-3">{row.name}</td>
                          <td className="px-4 py-3">{row.email}</td>
                          <td className="px-4 py-3">
                            <MaskedRrnCell
                              id={row.id}
                              maskedRrn={row.maskedRrn}
                              revealAction={revealCompanyNewHireRrn}
                            />
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatDate(row.hireDate)}
                          </td>
                          <td className="px-4 py-3">
                            {row.department ?? "-"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              <div>
                                {SALARY_TYPE_LABELS[row.salaryType]} ·{" "}
                                {SALARY_BASIS_LABELS[row.salaryBasis]}
                              </div>
                              <div className="text-muted-foreground">
                                {formatSalaryAmount(row.salaryAmount)}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {row.isContract ? (
                              <div className="space-y-1">
                                <Badge variant="secondary">계약직</Badge>
                                <div className="text-xs text-muted-foreground">
                                  {row.contractStart && row.contractEnd
                                    ? `${formatDate(row.contractStart)} ~ ${formatDate(row.contractEnd)}`
                                    : "—"}
                                </div>
                              </div>
                            ) : (
                              <Badge variant="outline">정규직</Badge>
                            )}
                          </td>
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
