import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";

export default async function FirmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth(["FIRM_STAFF", "FIRM_ADMIN"]);

  return (
    <div>
      <aside>
        <nav>
          <div>
            <Link href="/firm/dashboard">대시보드</Link>
          </div>
          <div>
            <Link href="/firm/registration-requests">가입 신청 관리</Link>
          </div>
          <div>
            <Link href="/firm/admin/users">직원 계정 관리</Link>
          </div>
        </nav>
      </aside>
      <main>{children}</main>
    </div>
  );
}

