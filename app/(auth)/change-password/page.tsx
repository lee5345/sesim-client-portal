import bcrypt from "bcrypt";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/db/db";
import { auth } from "@/auth";
import { requireAuth } from "@/lib/auth/guards";
import { logoutAction } from "@/lib/auth/logout";

const schema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default async function ChangePasswordPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.mustChangePassword) {
    redirect("/post-login");
  }

  async function action(formData: FormData) {
    "use server";

    const s = await requireAuth(undefined, { allowMustChangePassword: true });
    const input = schema.parse({
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });

    const passwordHash = await bcrypt.hash(input.password, 12);
    await prisma.user.update({
      where: { id: s.user.userId },
      data: { passwordHash, mustChangePassword: false },
    });

    await logoutAction();
  }

  return (
    <div>
      <h1>비밀번호 변경</h1>
      <form action={action}>
        <div>
          <label>
            새 비밀번호 (8자 이상)
            <input name="password" type="password" minLength={8} required />
          </label>
        </div>
        <div>
          <label>
            새 비밀번호 확인
            <input
              name="confirmPassword"
              type="password"
              minLength={8}
              required
            />
          </label>
        </div>
        <button type="submit">변경하기</button>
      </form>
      <form action={logoutAction} style={{ marginTop: 16 }}>
        <button type="submit">로그아웃</button>
      </form>
    </div>
  );
}

