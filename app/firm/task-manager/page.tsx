import type { Metadata } from "next";
import Link from "next/link";
import { Archive } from "lucide-react";

import { Suspense } from "react";

import { ActiveOfficeTasksBoard } from "@/components/firm/office-tasks/active-office-tasks-board";
import { OfficeTaskFormDialog } from "@/components/firm/office-tasks/office-task-form-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth/guards";
import {
  listActiveOfficeTasks,
  listOfficeTaskCompanyOptions,
  listOfficeTaskStaffOptions,
} from "@/modules/office-tasks/actions";

export const metadata: Metadata = {
  title: "사무실 업무 관리",
};

export default async function FirmTaskManagerPage() {
  const session = await requireAuth(["FIRM_STAFF", "FIRM_ADMIN"]);
  const isAdmin = session.user.role === "FIRM_ADMIN";

  const [tasks, staffUsers, companies] = await Promise.all([
    listActiveOfficeTasks(),
    listOfficeTaskStaffOptions(),
    listOfficeTaskCompanyOptions(),
  ]);

  return (
    <div className="mx-auto flex h-[calc(100vh-3rem)] max-w-5xl flex-col gap-8 overflow-hidden md:h-[calc(100vh-4rem)]">
      <div className="shrink-0">
        <PageHeader
          title="사무실 업무 관리"
          description="각종 사무실 내 업무들을 확인, 등록, 관리합니다."
          actions={
            <>
              <Button
                nativeButton={false}
                variant="outline"
                render={<Link href="/firm/task-manager/completed" />}
              >
                <Archive />
                완료된 업무
              </Button>
              <OfficeTaskFormDialog
                mode="create"
                currentUserId={session.user.userId}
                isAdmin={isAdmin}
                staffUsers={staffUsers}
                companies={companies}
              />
            </>
          }
        />
      </div>

      <div className="min-h-0 flex-1">
        <Suspense fallback={null}>
          <ActiveOfficeTasksBoard
            tasks={tasks}
            currentUserId={session.user.userId}
            isAdmin={isAdmin}
            staffUsers={staffUsers}
            companies={companies}
          />
        </Suspense>
      </div>
    </div>
  );
}
