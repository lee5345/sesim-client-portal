import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { CompletedOfficeTasksList } from "@/components/firm/office-tasks/completed-office-tasks-list";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth/guards";
import {
  listCompletedOfficeTasks,
  listOfficeTaskCompanyOptions,
  listOfficeTaskStaffOptions,
} from "@/modules/office-tasks/actions";

export const metadata: Metadata = {
  title: "완료된 업무",
};

export default async function FirmCompletedTasksPage() {
  const session = await requireAuth(["FIRM_STAFF", "FIRM_ADMIN"]);
  const isAdmin = session.user.role === "FIRM_ADMIN";

  const [tasks, staffUsers, companies] = await Promise.all([
    listCompletedOfficeTasks(),
    listOfficeTaskStaffOptions(),
    listOfficeTaskCompanyOptions(),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        title="완료된 업무"
        description="완료 처리된 사무실 업무를 검색하고 관리합니다."
        actions={
          <Button
            nativeButton={false}
            variant="outline"
            render={<Link href="/firm/task-manager" />}
          >
            <ArrowLeft />
            진행 중인 업무
          </Button>
        }
      />

      <CompletedOfficeTasksList
        tasks={tasks}
        currentUserId={session.user.userId}
        isAdmin={isAdmin}
        staffUsers={staffUsers}
        companies={companies}
      />
    </div>
  );
}
