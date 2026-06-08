import Link from "next/link";
import { redirect } from "next/navigation";

import { createSignupRequestAction } from "@/modules/auth/registration-requests";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function SignupRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const { success, error } = await searchParams;

  async function action(formData: FormData) {
    "use server";
    const result = await createSignupRequestAction(formData);
    if (!result.ok) {
      redirect("/signup-request?error=email_taken");
    }
    redirect("/signup-request?success=1");
  }

  return (
    <AuthShell
      title="가입 신청"
      description="고객사 관리자 계정 신청서를 제출해 주세요. 사무소 검토 후 안내드립니다."
      footer={
        <p>
          이미 계정이 있으신가요?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            로그인
          </Link>
        </p>
      }
    >
      {success ? (
        <p className="mb-4 rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
          신청이 접수되었습니다. 검토 후 이메일로 안내드리겠습니다.
        </p>
      ) : null}
      {error === "email_taken" ? (
        <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          이미 사용 중인 이메일입니다. 로그인하거나 다른 이메일을 사용해 주세요.
        </p>
      ) : null}

      <form action={action} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">이름</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">이메일</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="companyName">회사명</Label>
          <Input id="companyName" name="companyName" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">전화번호 (선택)</Label>
          <Input id="phone" name="phone" type="tel" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="note">메모 (선택)</Label>
          <textarea
            id="note"
            name="note"
            rows={3}
            className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        <Button type="submit" className="w-full">
          신청하기
        </Button>
      </form>
    </AuthShell>
  );
}
