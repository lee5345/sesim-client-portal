import type { Metadata } from "next";

import { requireAuth } from "@/lib/auth/guards";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "사무실 업무 관리",
};

export default async function FirmTaskManagerPage() {
  await requireAuth(["FIRM_STAFF", "FIRM_ADMIN"]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="사무실 업무 관리"
        description="각종 사무실 내 업무들을 확인, 등록, 관리합니다."
      />
      <p className="text-sm text-muted-foreground">준비 중입니다.</p>
    </div>
  );
}
