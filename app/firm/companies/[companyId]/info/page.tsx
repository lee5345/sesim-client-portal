import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { CompanyProfileView } from "@/components/companies/company-profile-view";
import { requireAuth } from "@/lib/auth/guards";
import { getCompanyProfile } from "@/modules/companies/company-profile";
import { Button } from "@/components/ui/button";

export default async function FirmCompanyInfoPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  await requireAuth(["FIRM_STAFF", "FIRM_ADMIN"]);
  const { companyId } = await params;

  const profile = await getCompanyProfile(companyId);
  if (!profile) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <Button
          nativeButton={false}
          variant="ghost"
          size="sm"
          className="w-fit gap-1 px-0 text-muted-foreground hover:text-foreground"
          render={<Link href={`/firm/companies/${companyId}`} />}
        >
          <ArrowLeft className="size-4" />
          {profile.name}
        </Button>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">고객사 등록 정보</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            각 항목 옆의 수정 버튼으로 정보를 업데이트할 수 있습니다.
          </p>
        </div>
      </div>

      <CompanyProfileView companyId={companyId} profile={profile} />
    </div>
  );
}
