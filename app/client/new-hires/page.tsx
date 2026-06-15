import { requireAuth } from "@/lib/auth/guards";
import { listDepartments } from "@/modules/companies/departments";
import { listHireIntakes } from "@/modules/hire-intakes/actions";
import { HireIntakesTable } from "@/components/client/hire-intakes-table";

export default async function ClientNewHiresPage() {
  const session = await requireAuth("CLIENT_ADMIN");
  const companyId = session.user.companyId;

  if (!companyId) {
    return <p className="text-muted-foreground">소속 회사 정보가 없습니다.</p>;
  }

  const [hireIntakes, departments] = await Promise.all([
    listHireIntakes(companyId),
    listDepartments(companyId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">입사자 정보</h1>
        <p className="mt-1 text-muted-foreground">
          신규 입사자 정보를 등록하고 관리합니다.
        </p>
      </div>

      <HireIntakesTable hireIntakes={hireIntakes} departments={departments} />
    </div>
  );
}
