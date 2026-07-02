import type { Metadata } from "next";

import { requireAuth } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "입사자 정보",
};
import { listDepartments } from "@/modules/companies/departments";
import { getCompanyById } from "@/modules/companies/companies";
import { listHireIntakes } from "@/modules/hire-intakes/actions";
import { HireIntakesTable } from "@/components/client/hire-intakes-table";
import { DepartmentManager } from "@/components/companies/department-manager";

export default async function ClientNewHiresPage() {
  const session = await requireAuth("CLIENT_ADMIN");
  const companyId = session.user.companyId;

  if (!companyId) {
    return <p className="text-muted-foreground">소속 회사 정보가 없습니다.</p>;
  }

  const [hireIntakes, departments, company] = await Promise.all([
    listHireIntakes(companyId),
    listDepartments(companyId),
    getCompanyById(companyId),
  ]);

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">입사자 정보</h1>
        <p className="mt-1 text-muted-foreground">
          신규 입사자 정보를 등록하고 관리합니다.
        </p>
      </div>

      <DepartmentManager departments={departments} companyId={companyId} />
      <HireIntakesTable
        hireIntakes={hireIntakes}
        departments={departments}
        companyId={companyId}
        companyName={company?.name}
      />
    </div>
  );
}
