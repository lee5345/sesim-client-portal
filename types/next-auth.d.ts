import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/lib/generated/prisma/client";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      userId: string;
      role: UserRole;
      companyId: string | null;
      mustChangePassword: boolean;
    };
  }

  interface User {
    role: UserRole;
    companyId: string | null;
    mustChangePassword: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    role: UserRole;
    companyId: string | null;
    mustChangePassword: boolean;
  }
}

