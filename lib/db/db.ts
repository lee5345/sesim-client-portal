import "dotenv/config";

import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaNeon({ connectionString });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const cachedPrisma = globalForPrisma.prisma;
const staleGlobal =
  cachedPrisma !== undefined &&
  typeof (cachedPrisma as { portalSyncCursor?: unknown }).portalSyncCursor ===
    "undefined";

const prismaInstance =
  cachedPrisma && !staleGlobal ? cachedPrisma : new PrismaClient({ adapter });

export const prisma = prismaInstance;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
