import type { Metadata } from "next";

import { requireAuth } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "설정",
};
import { listDepartments } from "@/modules/companies/departments";
import { DepartmentManager } from "@/components/companies/department-manager";
import { AcknowledgeChangesOnMount } from "@/components/layout/acknowledge-changes-on-mount";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ClientSettingsPage() {
  const session = await requireAuth("CLIENT_ADMIN");
  const companyId = session.user.companyId;

  if (!companyId) {
    return <p className="text-muted-foreground">소속 회사 정보가 없습니다.</p>;
  }

  const departments = await listDepartments(companyId);

  return (
    <div className="space-y-8">
      <AcknowledgeChangesOnMount
        companyId={companyId}
        entityTypes={["COMPANY_PROFILE", "DEPARTMENT"]}
      />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">설정</h1>
        <p className="mt-1 text-muted-foreground">
          회사 정보 및 부서를 관리합니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>부서 관리</CardTitle>
          <CardDescription>
            입사자 등록 시 선택할 부서 목록을 관리합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DepartmentManager departments={departments} />
        </CardContent>
      </Card>
    </div>
  );
}
