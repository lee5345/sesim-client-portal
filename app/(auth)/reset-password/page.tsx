import bcrypt from "bcrypt";
import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/db/db";
import {
  consumePasswordResetToken,
  validatePasswordResetToken,
} from "@/lib/auth/password-reset";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

function getResetPasswordErrorMessage(error?: string) {
  switch (error) {
    case "mismatch":
      return "비밀번호가 일치하지 않습니다.";
    case "invalid":
      return "비밀번호는 8자 이상이어야 합니다.";
    default:
      return null;
  }
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;
  const errorMessage = getResetPasswordErrorMessage(error);

  if (!token) {
    return (
      <AuthShell title="비밀번호 재설정" description="유효하지 않은 링크입니다.">
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline">
            로그인 페이지로 이동
          </Link>
        </p>
      </AuthShell>
    );
  }

  try {
    await validatePasswordResetToken(token);
  } catch {
    return (
      <AuthShell
        title="비밀번호 재설정"
        description="링크가 유효하지 않거나 만료되었습니다."
      >
        <p className="text-center text-sm text-muted-foreground">
          다시 요청해 주세요.{" "}
          <Link href="/login" className="text-primary hover:underline">
            로그인
          </Link>
        </p>
      </AuthShell>
    );
  }

  async function action(formData: FormData) {
    "use server";

    const tokenValue = String(formData.get("token") ?? "");
    const result = schema.safeParse({
      token: tokenValue,
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });

    if (!result.success) {
      const hasMismatch = result.error.issues.some(
        (issue) => issue.path[0] === "confirmPassword" && issue.code === "custom",
      );
      const errorCode = hasMismatch ? "mismatch" : "invalid";
      redirect(
        `/reset-password?token=${encodeURIComponent(tokenValue)}&error=${errorCode}`,
      );
    }

    const input = result.data;
    const userId = await validatePasswordResetToken(input.token);
    const passwordHash = await bcrypt.hash(input.password, 12);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { passwordHash, mustChangePassword: false },
      });
      await consumePasswordResetToken(input.token, tx);
    });

    redirect("/login?resetSuccess=1");
  }

  return (
    <AuthShell
      title="비밀번호 재설정"
      description="새 비밀번호를 설정해 주세요."
    >
      {errorMessage ? (
        <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}
      <form action={action} className="space-y-4">
        <input type="hidden" name="token" value={token} />
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
          재설정하기
        </Button>
      </form>
    </AuthShell>
  );
}

