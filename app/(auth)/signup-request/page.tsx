import { redirect } from "next/navigation";

import { createSignupRequestAction } from "@/modules/auth/registration-requests";

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
    <div>
      <h1>가입 신청</h1>
      {success ? <p>신청이 접수되었습니다.</p> : null}
      {error === "email_taken" ? (
        <p>이미 사용 중인 이메일입니다. 로그인하거나 다른 이메일을 사용해 주세요.</p>
      ) : null}
      <form action={action}>
        <div>
          <label>
            이름
            <input name="name" required />
          </label>
        </div>
        <div>
          <label>
            이메일
            <input name="email" type="email" required />
          </label>
        </div>
        <div>
          <label>
            회사명
            <input name="companyName" required />
          </label>
        </div>
        <div>
          <label>
            전화번호 (선택)
            <input name="phone" />
          </label>
        </div>
        <div>
          <label>
            메모 (선택)
            <textarea name="note" />
          </label>
        </div>
        <button type="submit">신청하기</button>
      </form>
    </div>
  );
}

