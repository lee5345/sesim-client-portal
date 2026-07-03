import Link from "next/link";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";

import { signIn, auth } from "@/auth";
import {
  DeactivatedAccountError,
  getLoginErrorMessage,
  LOGIN_ERROR_DEACTIVATED,
} from "@/lib/auth/errors";
import { SessionRevokedDialog } from "@/components/auth/session-revoked-dialog";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  checkSessionAuthority,
  revokeSessionForAuthorityChange,
} from "@/lib/auth/session-authority";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    success?: string;
    revoked?: string;
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

  const { error, success, revoked, resetSuccess } = await searchParams;
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

  return (
    <AuthShell
      title="로그인"
      description="고객사 및 사무소 계정으로 로그인하세요."
      footer={
        <div className="space-y-2">
          <p>
            비밀번호를 잊으셨나요?{" "}
            <Link
              href="/forgot-password"
              className="font-medium text-primary hover:underline"
            >
              비밀번호 재설정
            </Link>
          </p>
          <p>
            새 고객이신가요?{" "}
            <Link
              href="/signup-request"
              className="font-medium text-primary hover:underline"
            >
              가입 신청하기
            </Link>
          </p>
        </div>
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
    </AuthShell>
  );
}
