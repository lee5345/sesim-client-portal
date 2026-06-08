import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";
import { formatDateTime } from "@/lib/format/date";
import { listCompanies } from "@/modules/companies/companies";
import { AddCompanyDialog } from "@/components/companies/add-company-dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function FirmCompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requireAuth(["FIRM_STAFF", "FIRM_ADMIN"]);
  const { q } = await searchParams;
  const companies = await listCompanies(q);
  const isAdmin = session.user.role === "FIRM_ADMIN";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">고객사 목록</h1>
          <p className="mt-1 text-muted-foreground">
            등록된 고객사를 조회하고 관리합니다.
          </p>
        </div>
        {isAdmin ? <AddCompanyDialog /> : null}
      </div>

      <form method="get" className="flex max-w-sm gap-2">
        <Input
          name="q"
          placeholder="회사명 검색"
          defaultValue={q ?? ""}
        />
        <Button type="submit" variant="secondary">
          검색
        </Button>
      </form>

      {companies.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {q ? "검색 결과가 없습니다." : "등록된 고객사가 없습니다."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {companies.map((company) => (
            <Link key={company.id} href={`/firm/companies/${company.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{company.name}</CardTitle>
                    <Badge variant={company.isActive ? "default" : "secondary"}>
                      {company.isActive ? "활성" : "비활성"}
                    </Badge>
                  </div>
                  {company.businessNumber ? (
                    <CardDescription>{company.businessNumber}</CardDescription>
                  ) : null}
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    입사자 {company._count.newHires}건 · 퇴사자{" "}
                    {company._count.terminations}건
                  </p>
                  <p className="text-xs">
                    최종 수정: {formatDateTime(company.updatedAt)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
