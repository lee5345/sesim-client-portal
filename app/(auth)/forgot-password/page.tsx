import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/db/db";
import { createPasswordResetToken } from "@/lib/auth/password-reset";
import { sendPasswordResetEmail } from "@/lib/auth/email";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const resetRequestSchema = z.object({
  email: z.string().trim().email("올바른 이메일을 입력해 주세요."),
});

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const { success } = await searchParams;

  async function action(formData: FormData) {
    "use server";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      throw new Error("NEXT_PUBLIC_APP_URL is not set");
    }

    const parsed = resetRequestSchema.safeParse({
      email: formData.get("email"),
    });
    if (!parsed.success) {
      redirect("/forgot-password?success=1");
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

    redirect("/forgot-password?success=1");
  }

  return (
    <AuthShell
      title="비밀번호 재설정"
      description="등록된 이메일 주소로 비밀번호 재설정 링크를 보내드립니다."
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
          입력하신 이메일이 등록되어 있다면 비밀번호 재설정 링크를 전송했습니다.
        </p>
      ) : null}

      <form action={action} className="space-y-4">
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
        <Button type="submit" className="w-full">
          재설정 링크 보내기
        </Button>
      </form>
    </AuthShell>
  );
}
