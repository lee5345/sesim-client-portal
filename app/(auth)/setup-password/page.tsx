import bcrypt from "bcrypt";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/db";
import {
  consumePasswordSetupToken,
  validatePasswordSetupToken,
} from "@/lib/auth/password-setup";
import { z } from "zod";

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

export default async function SetupPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return <div>유효하지 않은 링크입니다.</div>;
  }

  try {
    await validatePasswordSetupToken(token);
  } catch {
    return <div>링크가 유효하지 않거나 만료되었습니다. 다시 요청해 주세요.</div>;
  }

  async function action(formData: FormData) {
    "use server";

    const input = schema.parse({
      token: formData.get("token"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });

    const userId = await validatePasswordSetupToken(input.token);
    const passwordHash = await bcrypt.hash(input.password, 12);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { passwordHash },
      });
      await consumePasswordSetupToken(input.token, tx);
    });

    redirect("/login?success=1");
  }

  return (
    <div>
      <h1>비밀번호 설정</h1>
      <form action={action}>
        <input type="hidden" name="token" value={token} />
        <div>
          <label>
            비밀번호 (8자 이상)
            <input name="password" type="password" minLength={8} required />
          </label>
        </div>
        <div>
          <label>
            비밀번호 확인
            <input
              name="confirmPassword"
              type="password"
              minLength={8}
              required
            />
          </label>
        </div>
        <button type="submit">설정하기</button>
      </form>
    </div>
  );
}

