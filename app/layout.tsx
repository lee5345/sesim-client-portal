import type { ReactNode } from "react";
import Link from "next/link";

import { auth } from "@/auth";
import { logoutAction } from "@/lib/auth/logout";

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  return (
    <html lang="ko">
      <body>
        <div style={{ padding: 12, borderBottom: "1px solid #ddd" }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Test Nav</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <Link href="/">/</Link>
            <Link href="/login">/login</Link>
            <Link href="/signup-request">/signup-request</Link>
            <Link href="/setup-password?token=PASTE_TOKEN_HERE">
              /setup-password?token=…
            </Link>
            <Link href="/change-password">/change-password</Link>
            <Link href="/post-login">/post-login</Link>
            <Link href="/client/dashboard">/client/dashboard</Link>
            <Link href="/firm/dashboard">/firm/dashboard</Link>
            <Link href="/firm/registration-requests">
              /firm/registration-requests
            </Link>
            <Link href="/firm/admin/users">/firm/admin/users</Link>
            <Link href="/unauthorized">/unauthorized</Link>
            {session?.user ? (
              <form action={logoutAction}>
                <button type="submit">로그아웃</button>
              </form>
            ) : null}
          </div>
        </div>
        <div style={{ padding: 12 }}>{children}</div>
      </body>
    </html>
  );
}

