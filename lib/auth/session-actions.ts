"use server";

import { requireValidSession } from "@/lib/auth/guards";

export async function validateSessionAuthorityAction() {
  await requireValidSession();
}
