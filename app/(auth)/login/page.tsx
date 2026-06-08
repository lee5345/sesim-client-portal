import Link from "next/link";
import { redirect } from "next/navigation";

import { signIn, auth } from "@/auth";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const session = await auth();
  if (session?.user) {
    redirect("/post-login");
  }

  const { error, success } = await searchParams;

  async function loginAction(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: String(formData.get("email") || ""),
        password: String(formData.get("password") || ""),
        redirectTo: "/post-login",
      });
    } catch {
      redirect("/login?error=1");
    }
  }

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
      {success ? (
        <p className="mb-4 rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
          비밀번호가 설정되었습니다. 로그인해 주세요.
        </p>
      ) : null}
      {error ? (
        <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          로그인에 실패했습니다. 이메일과 비밀번호를 확인해 주세요.
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
