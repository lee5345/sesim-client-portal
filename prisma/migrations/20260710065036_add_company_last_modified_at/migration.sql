-- AlterTable
ALTER TABLE "Company" ADD COLUMN "lastModifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill from existing related activity timestamps
UPDATE "Company" c
SET "lastModifiedAt" = GREATEST(
  c."updatedAt",
  COALESCE((SELECT MAX("updatedAt") FROM "Department" d WHERE d."companyId" = c.id), c."updatedAt"),
  COALESCE(
    (SELECT MAX(GREATEST("updatedAt", "createdAt")) FROM "User" u WHERE u."companyId" = c.id),
    c."updatedAt"
  ),
  COALESCE((SELECT MAX("updatedAt") FROM "NewHire" nh WHERE nh."companyId" = c.id), c."updatedAt"),
  COALESCE((SELECT MAX("updatedAt") FROM "Termination" t WHERE t."companyId" = c.id), c."updatedAt"),
  COALESCE((SELECT MAX("updatedAt") FROM "CompensationChange" cc WHERE cc."companyId" = c.id), c."updatedAt"),
  COALESCE((SELECT MAX("updatedAt") FROM "CompensationInfo" ci WHERE ci."companyId" = c.id), c."updatedAt"),
  COALESCE((SELECT MAX("updatedAt") FROM "DailyWorker" dw WHERE dw."companyId" = c.id), c."updatedAt")
);
