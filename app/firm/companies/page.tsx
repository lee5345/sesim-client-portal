import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "고객사 목록",
};

import { requireAuth } from "@/lib/auth/guards";
import { listCompanies } from "@/modules/companies/companies";
import { listFirmStaffUsers } from "@/modules/auth/staff-users";
import { AddCompanyDialog } from "@/components/companies/add-company-dialog";
import { CompaniesList } from "@/components/companies/companies-list";

export default async function FirmCompaniesPage() {
  const session = await requireAuth(["FIRM_STAFF", "FIRM_ADMIN"]);
  const [companies, staffUsers] = await Promise.all([
    listCompanies(),
    listFirmStaffUsers(),
  ]);
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

      <CompaniesList
        companies={companies}
        currentUserName={session.user.name ?? ""}
        staffUsers={staffUsers.map((user) => ({
          id: user.id,
          name: user.name,
          isActive: user.isActive,
        }))}
      />
    </div>
  );
}
