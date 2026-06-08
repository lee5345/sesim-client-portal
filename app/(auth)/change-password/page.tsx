import bcrypt from "bcrypt";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/db/db";
import { auth } from "@/auth";
import { requireAuth } from "@/lib/auth/guards";
import { logoutAction } from "@/lib/auth/logout";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <AuthShell
      title="비밀번호 변경"
      description="보안을 위해 새 비밀번호를 설정해 주세요."
    >
      <form action={action} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">새 비밀번호 (8자 이상)</Label>
          <Input
            id="password"
            name="password"
            type="password"
            minLength={8}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            minLength={8}
            required
          />
        </div>
        <Button type="submit" className="w-full">
          변경하기
        </Button>
      </form>

      <form action={logoutAction} className="mt-4 border-t pt-4">
        <Button type="submit" variant="ghost" className="w-full">
          로그아웃
        </Button>
      </form>
    </AuthShell>
  );
}
