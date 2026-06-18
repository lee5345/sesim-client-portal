import { signOut } from "@/auth";
import { isSessionRevokeReason } from "@/lib/auth/session-revoke-reasons";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reason = searchParams.get("reason");
  const redirectTo = isSessionRevokeReason(reason)
    ? `/login?revoked=${reason}`
    : "/login";

  await signOut({ redirectTo });
}
