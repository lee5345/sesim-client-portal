import "dotenv/config";

import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaNeon({ connectionString });

// Bump after schema changes that require `prisma generate`.
const PRISMA_CLIENT_SCHEMA_REVISION = 2;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaSchemaRevision?: number;
};

const cachedPrisma = globalForPrisma.prisma;
const staleGlobal =
  cachedPrisma !== undefined &&
  globalForPrisma.prismaSchemaRevision !== PRISMA_CLIENT_SCHEMA_REVISION;

const prismaInstance =
  cachedPrisma && !staleGlobal ? cachedPrisma : new PrismaClient({ adapter });

export const prisma = prismaInstance;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prismaInstance;
  globalForPrisma.prismaSchemaRevision = PRISMA_CLIENT_SCHEMA_REVISION;
}
