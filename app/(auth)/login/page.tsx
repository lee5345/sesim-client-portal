import Link from "next/link";
import { redirect } from "next/navigation";

import { signIn, auth } from "@/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) {
    redirect("/post-login");
  }

  const { error } = await searchParams;

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
    <div>
      <h1>로그인</h1>
      {error ? <p>로그인에 실패했습니다. 다시 시도해 주세요.</p> : null}
      <form action={loginAction}>
        <div>
          <label>
            이메일
            <input name="email" type="email" required />
          </label>
        </div>
        <div>
          <label>
            비밀번호
            <input name="password" type="password" required />
          </label>
        </div>
        <button type="submit">로그인</button>
      </form>
      <p>
        <Link href="/signup-request">새 고객이신가요? 가입 신청하기</Link>
      </p>
    </div>
  );
}

