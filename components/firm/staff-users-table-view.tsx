"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { getRoleLabel } from "@/lib/auth/roles";
import { formatDate } from "@/lib/format/date";
import type { UserRole } from "@/lib/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { Input } from "@/components/ui/input";

type StaffUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: Date;
};

type StaffUsersTableViewProps = {
  users: StaffUser[];
  currentUserId: string;
  toggleAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
};

export function StaffUsersTableView({
  users,
  currentUserId,
  toggleAction,
  deleteAction,
}: StaffUsersTableViewProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return users;
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(trimmed) ||
        user.email.toLowerCase().includes(trimmed),
    );
  }, [users, query]);

  return (
    <div className="space-y-4">
      <div className="flex max-w-sm gap-2">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="이름, 이메일 검색"
        />
        <Button type="button" variant="secondary" onClick={() => router.refresh()}>
          검색
        </Button>
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {query.trim() ? "검색 결과가 없습니다." : "등록된 직원 계정이 없습니다."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left">
                <th className="border-r border-border/30 px-4 py-3 font-medium last:border-r-0">
                  이름
                </th>
                <th className="border-r border-border/30 px-4 py-3 font-medium last:border-r-0">
                  이메일
                </th>
                <th className="border-r border-border/30 px-4 py-3 font-medium last:border-r-0">
                  역할
                </th>
                <th className="border-r border-border/30 px-4 py-3 font-medium last:border-r-0">
                  상태
                </th>
                <th className="border-r border-border/30 px-4 py-3 font-medium last:border-r-0">
                  생성일
                </th>
                <th className="px-4 py-3 text-right font-medium">관리</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => {
                const isSelf = user.id === currentUserId;

                return (
                  <tr
                    key={user.id}
                    className="border-b last:border-0 hover:bg-muted/20"
                  >
                    <td className="border-r border-border/30 px-4 py-3 font-medium last:border-r-0">
                      {user.name}
                    </td>
                    <td className="border-r border-border/30 px-4 py-3 text-muted-foreground last:border-r-0">
                      {user.email}
                    </td>
                    <td className="border-r border-border/30 px-4 py-3 last:border-r-0">
                      <Badge
                        variant={
                          user.role === "FIRM_ADMIN" ? "default" : "secondary"
                        }
                      >
                        {getRoleLabel(user.role)}
                      </Badge>
                    </td>
                    <td className="border-r border-border/30 px-4 py-3 last:border-r-0">
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
                    <td className="border-r border-border/30 px-4 py-3 text-muted-foreground last:border-r-0">
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
                            <Button type="submit" variant="outline" size="sm">
                              {user.isActive ? "비활성화" : "활성화"}
                            </Button>
                          </form>
                          <ConfirmDeleteDialog
                            title="직원 계정 삭제"
                            description={`"${user.name}" (${user.email}) 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
                            action={deleteAction}
                            hiddenFields={{ userId: user.id }}
                            triggerLabel="삭제"
                            requireTypedConfirmation
                          />
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
    </div>
  );
}
