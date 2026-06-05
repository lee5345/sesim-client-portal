import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/db";
import { requireAuth } from "@/lib/auth/guards";
import {
  createFirmStaffUserAction,
  deleteUserAction,
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

  const users = await prisma.user.findMany({
    where: { role: { in: ["FIRM_STAFF", "FIRM_ADMIN"] } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      mustChangePassword: true,
      createdAt: true,
    },
  });

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
    <div>
      <h1>직원 계정 관리</h1>
      {error === "self" ? (
        <p>본인 계정은 비활성화하거나 삭제할 수 없습니다.</p>
      ) : null}

      <h2>신규 생성</h2>
      <form action={createAction}>
        <div>
          <label>
            이름
            <input name="name" required />
          </label>
        </div>
        <div>
          <label>
            이메일
            <input name="email" type="email" required />
          </label>
        </div>
        <div>
          <label>
            역할
            <select name="role" defaultValue="FIRM_STAFF">
              <option value="FIRM_STAFF">FIRM_STAFF</option>
              <option value="FIRM_ADMIN">FIRM_ADMIN</option>
            </select>
          </label>
        </div>
        <div>
          <label>
            임시 비밀번호 (8자 이상)
            <input name="tempPassword" type="password" minLength={8} required />
          </label>
        </div>
        <button type="submit">생성</button>
      </form>

      <h2>직원 목록</h2>
      <table>
        <thead>
          <tr>
            <th>이름</th>
            <th>이메일</th>
            <th>역할</th>
            <th>활성</th>
            <th>비번 변경 필요</th>
            <th>생성일</th>
            <th>액션</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{u.isActive ? "Y" : "N"}</td>
              <td>{u.mustChangePassword ? "Y" : "N"}</td>
              <td>{u.createdAt.toISOString()}</td>
              <td>
                {u.id === currentUserId ? (
                  <span>본인</span>
                ) : (
                  <>
                    <form action={toggleAction}>
                      <input type="hidden" name="userId" value={u.id} />
                      <input
                        type="hidden"
                        name="isActive"
                        value={u.isActive ? "false" : "true"}
                      />
                      <button type="submit">
                        {u.isActive ? "비활성화" : "활성화"}
                      </button>
                    </form>
                    <form action={deleteAction}>
                      <input type="hidden" name="userId" value={u.id} />
                      <button type="submit">삭제</button>
                    </form>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

