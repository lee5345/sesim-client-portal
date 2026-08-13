/*
  Warnings:

  - You are about to drop the column `rrnEncrypted` on the `CompensationChange` table. All the data in the column will be lost.
  - You are about to drop the column `rrnIv` on the `CompensationChange` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "UnusedLeaveUnit" AS ENUM ('DAYS', 'HOURS');

-- AlterTable
ALTER TABLE "CompensationChange" DROP COLUMN "rrnEncrypted",
DROP COLUMN "rrnIv",
ADD COLUMN     "notes" TEXT;

-- CreateTable
CREATE TABLE "CompensationInfo" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "overtimeHours" DECIMAL(6,2),
    "holidayHours" DECIMAL(6,2),
    "nightHours" DECIMAL(6,2),
    "absenceDays" INTEGER,
    "lateEarlyLeaveHours" DECIMAL(6,2),
    "incentiveAmount" INTEGER,
    "unusedLeaveUnit" "UnusedLeaveUnit",
    "unusedLeaveAmount" DECIMAL(6,1),
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" UUID NOT NULL,

    CONSTRAINT "CompensationInfo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompensationInfo_companyId_year_month_deletedAt_idx" ON "CompensationInfo"("companyId", "year", "month", "deletedAt");

-- CreateIndex
CREATE INDEX "CompensationInfo_companyId_deletedAt_idx" ON "CompensationInfo"("companyId", "deletedAt");

-- AddForeignKey
ALTER TABLE "CompensationInfo" ADD CONSTRAINT "CompensationInfo_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompensationInfo" ADD CONSTRAINT "CompensationInfo_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
