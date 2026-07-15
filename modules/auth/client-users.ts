"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/db/db";
import { requireAuth } from "@/lib/auth/guards";
import { sortByActivityThenKoreanName } from "@/lib/sort/korean";
import { hasValidDeleteConfirmation } from "@/lib/validation/delete-confirmation";
import { bumpSyncCursors } from "@/modules/realtime/sync";

const CLIENT_ACCOUNTS_PATH = "/firm/client-accounts";

const toggleSchema = z.object({
  userId: z.string().uuid(),
  isActive: z.enum(["true", "false"]),
});

const deleteSchema = z.object({
  userId: z.string().uuid(),
});

async function requireClientAdminUser(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, role: "CLIENT_ADMIN" },
    select: { id: true, companyId: true },
  });
  if (!user) {
    redirect(CLIENT_ACCOUNTS_PATH);
  }

  return user;
}

export async function toggleClientUserActiveAction(formData: FormData) {
  await requireAuth(["FIRM_STAFF", "FIRM_ADMIN"]);

  const input = toggleSchema.parse({
    userId: formData.get("userId"),
    isActive: formData.get("isActive"),
  });

  const user = await requireClientAdminUser(input.userId);

  await prisma.user.update({
    where: { id: input.userId },
    data: { isActive: input.isActive === "true" },
  });

  if (user.companyId) {
    await bumpSyncCursors(user.companyId);
  }

  revalidatePath(CLIENT_ACCOUNTS_PATH);
}

export type AccountDeleteResult = "deleted" | "deactivated";

export async function deleteClientUserAction(
  formData: FormData,
): Promise<AccountDeleteResult> {
  await requireAuth(["FIRM_STAFF", "FIRM_ADMIN"]);

  if (!hasValidDeleteConfirmation(formData)) {
    throw new Error("삭제 확인 문구가 일치하지 않습니다.");
  }

  const input = deleteSchema.parse({
    userId: formData.get("userId"),
  });

  const user = await requireClientAdminUser(input.userId);

  const result = await prisma.$transaction(async (tx) => {
    const count = await tx.auditLog.count({ where: { actorId: input.userId } });
    if (count > 0) {
      await tx.user.update({
        where: { id: input.userId },
        data: { isActive: false },
      });
      return "deactivated" as const;
    }

    await tx.passwordSetupToken.deleteMany({ where: { userId: input.userId } });
    await tx.passwordResetToken.deleteMany({ where: { userId: input.userId } });
    await tx.user.delete({ where: { id: input.userId } });
    return "deleted" as const;
  });

  if (user.companyId) {
    await bumpSyncCursors(user.companyId);
  }

  revalidatePath(CLIENT_ACCOUNTS_PATH);
  return result;
}

function buildSignupPhoneByEmail(
  requests: { email: string; phone: string | null }[],
) {
  const phoneByEmail = new Map<string, string | null>();
  for (const request of requests) {
    if (!phoneByEmail.has(request.email)) {
      phoneByEmail.set(request.email, request.phone);
    }
  }
  return phoneByEmail;
}

function withSignupPhone<T extends { email: string }>(
  users: T[],
  phoneByEmail: Map<string, string | null>,
) {
  return users.map((user) => ({
    ...user,
    signupPhone: phoneByEmail.get(user.email) ?? null,
  }));
}

function withPasswordSetupStatus<
  T extends {
    mustChangePassword: boolean;
    passwordSetupTokens: { id: string }[];
  },
>(users: T[]) {
  return users.map(({ passwordSetupTokens, ...user }) => ({
    ...user,
    mustChangePassword:
      user.mustChangePassword || passwordSetupTokens.length > 0,
  }));
}

const clientAdminSelect = {
  id: true,
  name: true,
  email: true,
  isActive: true,
  mustChangePassword: true,
  createdAt: true,
  passwordSetupTokens: {
    where: { usedAt: null },
    select: { id: true },
    take: 1,
  },
} as const;

export async function listClientAccountsByCompany() {
  const [companies, unassigned, approvedRequests] = await Promise.all([
    prisma.company.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        isActive: true,
        users: {
          where: { role: "CLIENT_ADMIN" },
          select: clientAdminSelect,
        },
      },
    }),
    prisma.user.findMany({
      where: { role: "CLIENT_ADMIN", companyId: null },
      select: clientAdminSelect,
    }),
    prisma.registrationRequest.findMany({
      where: { status: "APPROVED" },
      orderBy: { reviewedAt: "desc" },
      select: { email: true, phone: true },
    }),
  ]);

  const phoneByEmail = buildSignupPhoneByEmail(approvedRequests);

  return {
    companies: sortByActivityThenKoreanName(
      companies.map((company) => ({
        ...company,
        users: sortByActivityThenKoreanName(
          withSignupPhone(
            withPasswordSetupStatus(company.users),
            phoneByEmail,
          ),
        ),
      })),
    ),
    unassigned: sortByActivityThenKoreanName(
      withSignupPhone(withPasswordSetupStatus(unassigned), phoneByEmail),
    ),
  };
}
