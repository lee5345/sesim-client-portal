import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireAuth } from "@/lib/auth/guards";
import { NO_BUSINESS_NUMBER_LABEL } from "@/lib/companies/labels";
import { getCompanyById } from "@/modules/companies/companies";
import { CompanyEditForm } from "@/components/companies/company-edit-form";
import { EmptyState } from "@/components/dashboard/empty-state";
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

export default async function FirmCompanyDetailPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const session = await requireAuth(["FIRM_STAFF", "FIRM_ADMIN"]);
  const { companyId } = await params;

  const company = await getCompanyById(companyId);
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
        <p className="text-sm text-muted-foreground">
          사업자등록번호: {company.businessNumber ?? NO_BUSINESS_NUMBER_LABEL}
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
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 text-left">
                      <th className="px-4 py-3 font-medium">이름</th>
                      <th className="px-4 py-3 font-medium">이메일</th>
                      <th className="px-4 py-3 font-medium">입사일</th>
                      <th className="px-4 py-3 font-medium">부서</th>
                      <th className="px-4 py-3 font-medium">등록일</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={5} className="p-0">
                        <EmptyState message="등록된 입사자 정보가 없습니다." />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
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
                    <tr>
                      <td colSpan={4} className="p-0">
                        <EmptyState message="등록된 퇴사자 정보가 없습니다." />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
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
