import Link from "next/link";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { z } from "zod";

import { signIn, auth } from "@/auth";
import { prisma } from "@/lib/db/db";
import {
  DeactivatedAccountError,
  getLoginErrorMessage,
  LOGIN_ERROR_DEACTIVATED,
} from "@/lib/auth/errors";
import { createPasswordResetToken } from "@/lib/auth/password-reset";
import { sendPasswordResetEmail } from "@/lib/auth/email";
import { SessionRevokedDialog } from "@/components/auth/session-revoked-dialog";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  checkSessionAuthority,
  revokeSessionForAuthorityChange,
} from "@/lib/auth/session-authority";

const resetRequestSchema = z.object({
  email: z.string().trim().email("올바른 이메일을 입력해 주세요."),
});

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    success?: string;
    revoked?: string;
    resetRequested?: string;
    resetSuccess?: string;
  }>;
}) {
  const session = await auth();
  if (session?.user) {
    const authorityMismatch = await checkSessionAuthority(session);
    if (authorityMismatch) {
      await revokeSessionForAuthorityChange(authorityMismatch);
    }
    redirect("/post-login");
  }

  const { error, success, revoked } = await searchParams;
  const loginErrorMessage = getLoginErrorMessage(error);

  async function loginAction(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: String(formData.get("email") || ""),
        password: String(formData.get("password") || ""),
        redirectTo: "/post-login",
      });
    } catch (error) {
      if (isRedirectError(error)) throw error;
      if (error instanceof DeactivatedAccountError) {
        redirect(`/login?error=${LOGIN_ERROR_DEACTIVATED}`);
      }
      redirect("/login?error=1");
    }
  }

  async function requestPasswordResetAction(formData: FormData) {
    "use server";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      throw new Error("NEXT_PUBLIC_APP_URL is not set");
    }

    const parsed = resetRequestSchema.safeParse({
      email: formData.get("resetEmail"),
    });
    if (!parsed.success) {
      redirect("/login?resetRequested=1");
    }

    const email = parsed.data.email;

    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, isActive: true },
      });
      if (user && user.isActive) {
        const token = await createPasswordResetToken(user.id);
        const resetUrl = `${appUrl}/reset-password?token=${token}`;
        await sendPasswordResetEmail(email, resetUrl);
      }
    } catch {
      // Intentionally ignore to avoid account enumeration.
    }

    redirect("/login?resetRequested=1");
  }

  const { resetRequested, resetSuccess } = await searchParams;

  return (
    <AuthShell
      title="로그인"
      description="고객사 및 사무소 계정으로 로그인하세요."
      footer={
        <p>
          새 고객이신가요?{" "}
          <Link
            href="/signup-request"
            className="font-medium text-primary hover:underline"
          >
            가입 신청하기
          </Link>
        </p>
      }
    >
      <SessionRevokedDialog revoked={revoked} />
      {success ? (
        <p className="mb-4 rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
          비밀번호가 설정되었습니다. 로그인해 주세요.
        </p>
      ) : null}
      {resetSuccess ? (
        <p className="mb-4 rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
          비밀번호가 재설정되었습니다. 로그인해 주세요.
        </p>
      ) : null}
      {resetRequested ? (
        <p className="mb-4 rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
          입력하신 이메일이 등록되어 있다면 비밀번호 재설정 링크를 전송했습니다.
        </p>
      ) : null}
      {loginErrorMessage ? (
        <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {loginErrorMessage}
        </p>
      ) : null}

      <form action={loginAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="name@company.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">비밀번호</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        <Button type="submit" size="lg" className="h-10 w-full">
          로그인
        </Button>
      </form>

      <div className="mt-6 border-t pt-6">
        <p className="mb-3 text-sm text-muted-foreground">
          비밀번호를 잊으셨나요?
        </p>
        <form action={requestPasswordResetAction} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="resetEmail">이메일</Label>
            <Input
              id="resetEmail"
              name="resetEmail"
              type="email"
              autoComplete="email"
              required
              placeholder="name@company.com"
            />
          </div>
          <Button type="submit" variant="outline" className="w-full">
            비밀번호 재설정 링크 보내기
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
