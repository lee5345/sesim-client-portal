import bcrypt from "bcrypt";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/db/db";
import { requireAuth, requireValidSession } from "@/lib/auth/guards";
import { logoutAction } from "@/lib/auth/logout";
import { SessionAuthorityGate } from "@/components/auth/session-authority-gate";
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

function getChangePasswordErrorMessage(error?: string) {
  switch (error) {
    case "mismatch":
      return "비밀번호가 일치하지 않습니다.";
    case "invalid":
      return "비밀번호는 8자 이상이어야 합니다.";
    default:
      return null;
  }
}

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireValidSession();

  if (!session.user.mustChangePassword) {
    redirect("/post-login");
  }

  const { error } = await searchParams;
  const errorMessage = getChangePasswordErrorMessage(error);

  async function action(formData: FormData) {
    "use server";

    const s = await requireAuth(undefined, { allowMustChangePassword: true });
    const result = schema.safeParse({
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });

    if (!result.success) {
      const hasMismatch = result.error.issues.some(
        (issue) =>
          issue.path[0] === "confirmPassword" && issue.code === "custom",
      );
      const errorCode = hasMismatch ? "mismatch" : "invalid";
      redirect(`/change-password?error=${errorCode}`);
    }

    const input = result.data;

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
      <SessionAuthorityGate />
      {errorMessage ? (
        <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}
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
