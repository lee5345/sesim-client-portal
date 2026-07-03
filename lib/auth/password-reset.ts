import crypto from "crypto";

import { prisma } from "@/lib/db/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import {
  PasswordResetTokenExpiredError,
  PasswordResetTokenInvalidError,
  PasswordResetTokenUsedError,
} from "@/lib/auth/errors";

const TOKEN_BYTES = 32;
const TOKEN_TTL_MS = 60 * 60 * 1000;

export async function createPasswordResetToken(userId: string) {
  const token = crypto.randomBytes(TOKEN_BYTES).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.passwordResetToken.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return token;
}

export async function createPasswordResetTokenTx(
  tx: Prisma.TransactionClient,
  userId: string,
) {
  const token = crypto.randomBytes(TOKEN_BYTES).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await tx.passwordResetToken.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return token;
}

export async function validatePasswordResetToken(token: string) {
  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
    select: { userId: true, expiresAt: true, usedAt: true },
  });

  if (!record) {
    throw new PasswordResetTokenInvalidError();
  }

  if (record.usedAt) {
    throw new PasswordResetTokenUsedError();
  }

  if (record.expiresAt.getTime() <= Date.now()) {
    throw new PasswordResetTokenExpiredError();
  }

  return record.userId;
}

export async function consumePasswordResetToken(
  token: string,
  tx?: Prisma.TransactionClient,
) {
  const client = tx ?? prisma;

  const record = await client.passwordResetToken.findUnique({
    where: { token },
    select: { id: true, expiresAt: true, usedAt: true },
  });

  if (!record) {
    throw new PasswordResetTokenInvalidError();
  }
  if (record.usedAt) {
    throw new PasswordResetTokenUsedError();
  }
  if (record.expiresAt.getTime() <= Date.now()) {
    throw new PasswordResetTokenExpiredError();
  }

  await client.passwordResetToken.update({
    where: { token },
    data: { usedAt: new Date() },
  });
}

