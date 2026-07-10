import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db/db";

type DbClient = Prisma.TransactionClient | typeof prisma;

export async function bumpCompanyLastModifiedAt(
  companyId: string,
  at: Date = new Date(),
  client: DbClient = prisma,
): Promise<void> {
  await client.company.update({
    where: { id: companyId },
    data: { lastModifiedAt: at },
  });
}
