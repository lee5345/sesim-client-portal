import { Users } from "lucide-react";

import type { UserRole } from "@/lib/generated/prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StaffUsersTableView } from "@/components/firm/staff-users-table-view";

type StaffUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: Date;
};

type StaffUsersTableProps = {
  users: StaffUser[];
  currentUserId: string;
  toggleAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
};

export function StaffUsersTable({
  users,
  currentUserId,
  toggleAction,
  deleteAction,
}: StaffUsersTableProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="size-4 text-primary" />
          직원 목록
        </CardTitle>
        <CardDescription>
          사무소 직원 및 관리자 계정을 확인하고 관리합니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <EmptyState message="등록된 직원 계정이 없습니다." />
        ) : (
          <StaffUsersTableView
            users={users}
            currentUserId={currentUserId}
            toggleAction={toggleAction}
            deleteAction={deleteAction}
          />
        )}
      </CardContent>
    </Card>
  );
}
