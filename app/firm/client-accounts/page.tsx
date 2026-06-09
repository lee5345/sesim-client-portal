import { AlertCircle, CheckCircle2 } from "lucide-react";
import { redirect } from "next/navigation";

import { ClientAccountsList } from "@/components/firm/client-accounts-list";
import { RegistrationRequestsList } from "@/components/firm/registration-requests-list";
import { PageHeader } from "@/components/layout/page-header";
import { prisma } from "@/lib/db/db";
import { requireAuth } from "@/lib/auth/guards";
import { sortByKoreanName } from "@/lib/sort/korean";
import {
  deleteClientUserAction,
  listClientAccountsByCompany,
  toggleClientUserActiveAction,
} from "@/modules/auth/client-users";
import {
  approveRegistrationRequestAction,
  rejectRegistrationRequestAction,
} from "@/modules/companies/registration-requests";

export default async function ClientAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ approved?: string; emailError?: string }>;
}) {
  await requireAuth(["FIRM_STAFF", "FIRM_ADMIN"]);

  const { approved, emailError } = await searchParams;

  const [pendingRequests, allCompaniesRaw, accountData] = await Promise.all([
    prisma.registrationRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        companyName: true,
        phone: true,
        note: true,
        createdAt: true,
      },
    }),
    prisma.company.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
    }),
    listClientAccountsByCompany(),
  ]);

  const allCompanies = sortByKoreanName(allCompaniesRaw, (company) => company.name);

  async function toggleAction(formData: FormData) {
    "use server";
    await toggleClientUserActiveAction(formData);
    redirect("/firm/client-accounts");
  }

  async function deleteAction(formData: FormData) {
    "use server";
    await deleteClientUserAction(formData);
    redirect("/firm/client-accounts");
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        title="고객 계정 관리"
        description="고객사 관리자 계정을 조회하고, 가입 신청을 검토합니다."
      />

      {approved && !emailError ? (
        <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <p>승인되었습니다. 비밀번호 설정 이메일을 클라이언트에게 발송했습니다.</p>
        </div>
      ) : null}
      {approved && emailError ? (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p>
            승인은 완료되었으나 비밀번호 설정 이메일 발송에 실패했습니다.
            Gmail SMTP 설정(GMAIL_USER, GMAIL_APP_PASSWORD)을 확인하거나,
            DB의 password_setup_tokens에서 링크를 직접 전달해 주세요.
            확인이 어려운 경우 개발자에게 문의해주세요.
          </p>
        </div>
      ) : null}
      <RegistrationRequestsList
        requests={pendingRequests}
        companies={allCompanies}
        approveAction={approveRegistrationRequestAction}
        rejectAction={rejectRegistrationRequestAction}
      />

      <div>
        <h2 className="mb-4 text-lg font-semibold">등록된 고객 계정</h2>
        <ClientAccountsList
          companies={accountData.companies}
          unassigned={accountData.unassigned}
          toggleAction={toggleAction}
          deleteAction={deleteAction}
        />
      </div>
    </div>
  );
}
