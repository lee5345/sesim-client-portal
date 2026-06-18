import { redirect } from "next/navigation";

import { requireValidSession } from "@/lib/auth/guards";

export default async function PostLoginPage() {
  const session = await requireValidSession();

  if (session.user.mustChangePassword) {
    redirect("/change-password");
  }

  if (session.user.role === "CLIENT_ADMIN") {
    redirect("/client/dashboard");
  }

  redirect("/firm/dashboard");
}

