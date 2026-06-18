import { redirect } from "next/navigation";

import { auth } from "@/auth";
import {
  checkSessionAuthority,
  revokeSessionForAuthorityChange,
} from "@/lib/auth/session-authority";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const authorityMismatch = await checkSessionAuthority(session);
  if (authorityMismatch) {
    await revokeSessionForAuthorityChange(authorityMismatch);
  }

  redirect("/post-login");
}
