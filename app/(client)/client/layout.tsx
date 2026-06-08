import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth("CLIENT_ADMIN");

  return (
    <div>
      <nav>
        <Link href="/client/dashboard">대시보드</Link>
      </nav>
      <main>{children}</main>
    </div>
  );
}

