import { auth } from "@/auth";

export default async function FirmDashboardPage() {
  const session = await auth();
  return <pre>{JSON.stringify(session?.user ?? null, null, 2)}</pre>;
}

