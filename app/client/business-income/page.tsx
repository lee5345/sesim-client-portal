import type { Metadata } from "next";

import { requireAuth } from "@/lib/auth/guards";
import { parseYearMonthSearchParams } from "@/lib/daily-workers/period";
import { BusinessIncomeTable } from "@/components/business-income/business-income-table";
import { getCompanyById } from "@/modules/companies/companies";
import { listBusinessIncomes } from "@/modules/business-income/actions";

export const metadata: Metadata = {
  title: "사업소득 정보",
};

export default async function ClientBusinessIncomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireAuth("CLIENT_ADMIN");
  const companyId = session.user.companyId;

  if (!companyId) {
    return <p className="text-muted-foreground">소속 회사 정보가 없습니다.</p>;
  }

  const query = await searchParams;
  const { year, month } = parseYearMonthSearchParams(query);

  const [businessIncomes, company] = await Promise.all([
    listBusinessIncomes(companyId, year, month),
    getCompanyById(companyId),
  ]);
  const rows = businessIncomes.map((row) => ({
    ...row,
    createdAt: row.createdAt,
  }));

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">사업소득 정보</h1>
        <p className="mt-1 text-muted-foreground">
          월별 사업소득 정보를 등록하고 관리합니다.
        </p>
      </div>

      <BusinessIncomeTable
        businessIncomes={rows}
        year={year}
        month={month}
        companyId={companyId}
        companyName={company?.name}
      />
    </div>
  );
}
