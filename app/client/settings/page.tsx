import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "설정",
};

export default async function ClientSettingsPage() {
  const session = await requireAuth("CLIENT_ADMIN");
  redirect(session.user.companyId ? "/client/new-hires" : "/client/dashboard");
}
