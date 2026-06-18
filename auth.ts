import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { z } from "zod";

import { prisma } from "@/lib/db/db";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { email, password } = credentialsSchema.parse(credentials);

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            passwordHash: true,
            role: true,
            companyId: true,
            isActive: true,
            mustChangePassword: true,
          },
        });

        if (!user) {
          throw new Error("Wrong email or password.");
        }

        if (!user.isActive) {
          throw new Error("Inactive account.");
        }

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) {
          throw new Error("Wrong email or password.");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyId: user.companyId,
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            role: true,
            companyId: true,
            mustChangePassword: true,
          },
        });

        if (dbUser) {
          token.userId = dbUser.id;
          token.role = dbUser.role;
          token.companyId = dbUser.companyId ?? null;
          token.mustChangePassword = dbUser.mustChangePassword;
        }
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.userId = (token.userId ?? token.sub) as string;
        session.user.role = token.role as (typeof session.user.role);
        session.user.companyId = (token.companyId ?? null) as string | null;
        session.user.mustChangePassword = Boolean(token.mustChangePassword);
      }
      return session;
    },
  },
});

