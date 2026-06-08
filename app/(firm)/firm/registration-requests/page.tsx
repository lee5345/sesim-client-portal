import { prisma } from "@/lib/db/db";
import { requireAuth } from "@/lib/auth/guards";
import {
  approveRegistrationRequestAction,
  rejectRegistrationRequestAction,
} from "@/modules/companies/registration-requests";

export default async function RegistrationRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ approved?: string; emailError?: string }>;
}) {
  await requireAuth(["FIRM_STAFF", "FIRM_ADMIN"]);

  const { approved, emailError } = await searchParams;

  const [requests, companies] = await Promise.all([
    prisma.registrationRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        companyName: true,
        phone: true,
        note: true,
        createdAt: true,
      },
    }),
    prisma.company.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div>
      <h1>가입 신청 관리</h1>
      {approved && !emailError ? (
        <p>승인되었습니다. 비밀번호 설정 이메일을 발송했습니다.</p>
      ) : null}
      {approved && emailError ? (
        <p>
          승인은 완료되었으나 비밀번호 설정 이메일 발송에 실패했습니다. Gmail
          SMTP 설정(GMAIL_USER, GMAIL_APP_PASSWORD)을 확인하거나, DB의
          password_setup_tokens 에서 링크를 직접 전달해 주세요.
        </p>
      ) : null}
      <table>
        <thead>
          <tr>
            <th>이름</th>
            <th>이메일</th>
            <th>회사명</th>
            <th>전화</th>
            <th>메모</th>
            <th>신청일</th>
            <th>처리</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr key={r.id}>
              <td>{r.name}</td>
              <td>{r.email}</td>
              <td>{r.companyName}</td>
              <td>{r.phone ?? ""}</td>
              <td>{r.note ?? ""}</td>
              <td>{r.createdAt.toISOString()}</td>
              <td>
                <form action={approveRegistrationRequestAction}>
                  <input type="hidden" name="requestId" value={r.id} />
                  <div>
                    <select name="companyId" defaultValue="">
                      <option value="">기존 회사 선택</option>
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input
                      name="newCompanyName"
                      placeholder="또는 새 회사명 입력"
                    />
                  </div>
                  <button type="submit">승인</button>
                </form>
                <form action={rejectRegistrationRequestAction}>
                  <input type="hidden" name="requestId" value={r.id} />
                  <button type="submit">거절</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

