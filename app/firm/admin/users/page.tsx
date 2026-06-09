import { AlertCircle } from "lucide-react";
import { redirect } from "next/navigation";

import { CreateStaffUserForm } from "@/components/firm/create-staff-user-form";
import { StaffUsersTable } from "@/components/firm/staff-users-table";
import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth/guards";
import {
  createFirmStaffUserAction,
  deleteUserAction,
  listFirmStaffUsers,
  toggleUserActiveAction,
} from "@/modules/auth/staff-users";

export default async function FirmAdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireAuth("FIRM_ADMIN");
  const { error } = await searchParams;
  const currentUserId = session.user.userId;

  const users = await listFirmStaffUsers();

  async function createAction(formData: FormData) {
    "use server";
    await createFirmStaffUserAction(formData);
    redirect("/firm/admin/users");
  }

  async function toggleAction(formData: FormData) {
    "use server";
    await toggleUserActiveAction(formData);
    redirect("/firm/admin/users");
  }

  async function deleteAction(formData: FormData) {
    "use server";
    await deleteUserAction(formData);
    redirect("/firm/admin/users");
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        title="직원 계정 관리"
        description="사무소 직원 및 관리자 계정을 생성하고 운영 상태를 관리합니다."
      />

      {error === "self" ? (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p>본인 계정은 비활성화하거나 삭제할 수 없습니다.</p>
        </div>
      ) : null}

      <CreateStaffUserForm action={createAction} />
      <StaffUsersTable
        users={users}
        currentUserId={currentUserId}
        toggleAction={toggleAction}
        deleteAction={deleteAction}
      />
    </div>
  );
}
