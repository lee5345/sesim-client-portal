import { redirect } from "next/navigation";

import { auth } from "@/auth";

export default async function PostLoginPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.mustChangePassword) {
    redirect("/change-password");
  }

  if (session.user.role === "CLIENT_ADMIN") {
    redirect("/client/dashboard");
  }

  redirect("/firm/dashboard");
}

