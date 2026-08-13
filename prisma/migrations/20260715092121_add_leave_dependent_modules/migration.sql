-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('MATERNITY_LEAVE', 'SPOUSE_MATERNITY_LEAVE', 'PRENATAL_PARENTAL_LEAVE', 'GENERAL_PARENTAL_LEAVE', 'CHILD_CARE_WORK_HOUR_REDUCTION', 'PREGNANCY_WORK_HOUR_REDUCTION');

-- CreateEnum
CREATE TYPE "FileAttachmentEntityType" AS ENUM ('LEAVE_RECORD', 'DEPENDENT_RECORD');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TenantChangeEntityType" ADD VALUE 'LEAVE_RECORD';
ALTER TYPE "TenantChangeEntityType" ADD VALUE 'DEPENDENT_RECORD';

-- CreateTable
CREATE TABLE "LeaveRecord" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "leaveType" "LeaveType" NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "expectedDeliveryDate" TIMESTAMP(3),
    "childName" TEXT,
    "childRrnEncrypted" TEXT,
    "childRrnIv" TEXT,
    "hoursBeforeReduction" INTEGER,
    "hoursAfterReduction" INTEGER,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" UUID NOT NULL,

    CONSTRAINT "LeaveRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DependentRecord" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "employeeName" TEXT NOT NULL,
    "dependentName" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "registrationRequestedDate" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" UUID NOT NULL,

    CONSTRAINT "DependentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileAttachment" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "entityType" "FileAttachmentEntityType" NOT NULL,
    "entityId" UUID NOT NULL,
    "blobPath" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" UUID NOT NULL,

    CONSTRAINT "FileAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeaveRecord_companyId_deletedAt_idx" ON "LeaveRecord"("companyId", "deletedAt");

-- CreateIndex
CREATE INDEX "LeaveRecord_companyId_periodStart_periodEnd_deletedAt_idx" ON "LeaveRecord"("companyId", "periodStart", "periodEnd", "deletedAt");

-- CreateIndex
CREATE INDEX "DependentRecord_companyId_deletedAt_idx" ON "DependentRecord"("companyId", "deletedAt");

-- CreateIndex
CREATE INDEX "DependentRecord_companyId_registrationRequestedDate_deleted_idx" ON "DependentRecord"("companyId", "registrationRequestedDate", "deletedAt");

-- CreateIndex
CREATE INDEX "FileAttachment_companyId_entityType_entityId_deletedAt_idx" ON "FileAttachment"("companyId", "entityType", "entityId", "deletedAt");

-- AddForeignKey
ALTER TABLE "LeaveRecord" ADD CONSTRAINT "LeaveRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRecord" ADD CONSTRAINT "LeaveRecord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DependentRecord" ADD CONSTRAINT "DependentRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DependentRecord" ADD CONSTRAINT "DependentRecord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAttachment" ADD CONSTRAINT "FileAttachment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAttachment" ADD CONSTRAINT "FileAttachment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
