import Link from "next/link";
import { Trash2 } from "lucide-react";

import { requireAuth } from "@/lib/auth/guards";
import { listCompanies } from "@/modules/companies/companies";
import { AddCompanyDialog } from "@/components/companies/add-company-dialog";
import { CompaniesList } from "@/components/companies/companies-list";
import { Button } from "@/components/ui/button";

export default async function FirmCompaniesPage() {
  const session = await requireAuth(["FIRM_STAFF", "FIRM_ADMIN"]);
  const companies = await listCompanies();
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
        <div className="flex flex-wrap gap-2">
          <Button
            nativeButton={false}
            variant="outline"
            render={<Link href="/firm/companies/deleted" />}
          >
            <Trash2 className="size-4" />
            최근 삭제된 고객사
          </Button>
          {isAdmin ? <AddCompanyDialog /> : null}
        </div>
      </div>

      <CompaniesList companies={companies} />
    </div>
  );
}
