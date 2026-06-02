import crypto from "crypto";

import { prisma } from "@/lib/db/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import {
  PasswordSetupTokenExpiredError,
  PasswordSetupTokenInvalidError,
  PasswordSetupTokenUsedError,
} from "@/lib/auth/errors";

const TOKEN_BYTES = 32;
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export async function createPasswordSetupToken(userId: string) {
  const token = crypto.randomBytes(TOKEN_BYTES).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.passwordSetupToken.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return token;
}

export async function createPasswordSetupTokenTx(
  tx: Prisma.TransactionClient,
  userId: string,
) {
  const token = crypto.randomBytes(TOKEN_BYTES).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await tx.passwordSetupToken.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return token;
}

export async function validatePasswordSetupToken(token: string) {
  const record = await prisma.passwordSetupToken.findUnique({
    where: { token },
    select: { userId: true, expiresAt: true, usedAt: true },
  });

  if (!record) {
    throw new PasswordSetupTokenInvalidError();
  }

  if (record.usedAt) {
    throw new PasswordSetupTokenUsedError();
  }

  if (record.expiresAt.getTime() <= Date.now()) {
    throw new PasswordSetupTokenExpiredError();
  }

  return record.userId;
}

export async function consumePasswordSetupToken(
  token: string,
  tx?: Prisma.TransactionClient,
) {
  const client = tx ?? prisma;

  const record = await client.passwordSetupToken.findUnique({
    where: { token },
    select: { id: true, expiresAt: true, usedAt: true },
  });

  if (!record) {
    throw new PasswordSetupTokenInvalidError();
  }
  if (record.usedAt) {
    throw new PasswordSetupTokenUsedError();
  }
  if (record.expiresAt.getTime() <= Date.now()) {
    throw new PasswordSetupTokenExpiredError();
  }

  await client.passwordSetupToken.update({
    where: { token },
    data: { usedAt: new Date() },
  });
}

