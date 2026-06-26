import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "최근 삭제된 고객사",
};
import { ArrowLeft } from "lucide-react";

import { requireAuth } from "@/lib/auth/guards";
import { listDeletedCompanies } from "@/modules/companies/companies";
import { DeletedCompaniesList } from "@/components/companies/deleted-companies-list";
import { Button } from "@/components/ui/button";

export default async function DeletedCompaniesPage() {
  const session = await requireAuth(["FIRM_STAFF", "FIRM_ADMIN"]);
  const companies = await listDeletedCompanies();
  const canManage = session.user.role === "FIRM_ADMIN";

  return (
    <div className="space-y-8">
      <div className="space-y-4">
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

        <div>
          <h1 className="text-2xl font-bold tracking-tight">최근 삭제된 고객사</h1>
          <p className="mt-1 text-muted-foreground">
            삭제된 고객사를 확인하고 필요 시 복구합니다.
          </p>
        </div>
      </div>

      <DeletedCompaniesList companies={companies} canManage={canManage} />
    </div>
  );
}
