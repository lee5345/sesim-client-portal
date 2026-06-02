"use server";

import bcrypt from "bcrypt";
import { z } from "zod";

import { prisma } from "@/lib/db/db";
import { requireAuth } from "@/lib/auth/guards";

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["FIRM_STAFF", "FIRM_ADMIN"]),
  tempPassword: z.string().min(8),
});

export async function createFirmStaffUserAction(formData: FormData) {
  await requireAuth("FIRM_ADMIN");

  const input = createSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    tempPassword: formData.get("tempPassword"),
  });

  const passwordHash = await bcrypt.hash(input.tempPassword, 12);

  await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      role: input.role,
      companyId: null,
      isActive: true,
      mustChangePassword: true,
      passwordHash,
    },
  });
}

const toggleSchema = z.object({
  userId: z.string().uuid(),
  isActive: z.enum(["true", "false"]),
});

export async function toggleUserActiveAction(formData: FormData) {
  await requireAuth("FIRM_ADMIN");

  const input = toggleSchema.parse({
    userId: formData.get("userId"),
    isActive: formData.get("isActive"),
  });

  await prisma.user.update({
    where: { id: input.userId },
    data: { isActive: input.isActive === "true" },
  });
}

const deleteSchema = z.object({
  userId: z.string().uuid(),
});

export async function deleteUserAction(formData: FormData) {
  await requireAuth("FIRM_ADMIN");

  const input = deleteSchema.parse({
    userId: formData.get("userId"),
  });

  await prisma.$transaction(async (tx) => {
    const count = await tx.auditLog.count({ where: { actorId: input.userId } });
    if (count > 0) {
      await tx.user.update({
        where: { id: input.userId },
        data: { isActive: false },
      });
      return;
    }

    await tx.user.delete({ where: { id: input.userId } });
  });
}

