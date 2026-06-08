import { Users } from "lucide-react";

import { getRoleLabel } from "@/lib/auth/roles";
import { formatDate } from "@/lib/format/date";
import type { UserRole } from "@/lib/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/empty-state";

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
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="px-4 py-3 font-medium">이름</th>
                  <th className="px-4 py-3 font-medium">이메일</th>
                  <th className="px-4 py-3 font-medium">역할</th>
                  <th className="px-4 py-3 font-medium">상태</th>
                  <th className="px-4 py-3 font-medium">생성일</th>
                  <th className="px-4 py-3 text-right font-medium">관리</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isSelf = user.id === currentUserId;

                  return (
                    <tr
                      key={user.id}
                      className="border-b last:border-0 hover:bg-muted/20"
                    >
                      <td className="px-4 py-3 font-medium">{user.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {user.email}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            user.role === "FIRM_ADMIN" ? "default" : "secondary"
                          }
                        >
                          {getRoleLabel(user.role)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <Badge
                            variant={user.isActive ? "outline" : "destructive"}
                            className={
                              user.isActive
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : undefined
                            }
                          >
                            {user.isActive ? "활성" : "비활성"}
                          </Badge>
                          {user.mustChangePassword ? (
                            <Badge variant="secondary">비번 변경 필요</Badge>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        {isSelf ? (
                          <span className="block text-right text-xs text-muted-foreground">
                            본인 계정
                          </span>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <form action={toggleAction}>
                              <input type="hidden" name="userId" value={user.id} />
                              <input
                                type="hidden"
                                name="isActive"
                                value={user.isActive ? "false" : "true"}
                              />
                              <Button
                                type="submit"
                                variant="outline"
                                size="sm"
                              >
                                {user.isActive ? "비활성화" : "활성화"}
                              </Button>
                            </form>
                            <form action={deleteAction}>
                              <input type="hidden" name="userId" value={user.id} />
                              <Button
                                type="submit"
                                variant="destructive"
                                size="sm"
                              >
                                삭제
                              </Button>
                            </form>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
