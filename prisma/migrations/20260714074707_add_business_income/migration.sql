-- AlterEnum
ALTER TYPE "TenantChangeEntityType" ADD VALUE 'BUSINESS_INCOME';

-- CreateTable
CREATE TABLE "BusinessIncome" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "rrnEncrypted" TEXT NOT NULL,
    "rrnIv" TEXT NOT NULL,
    "incomeAmount" INTEGER NOT NULL,
    "incomeBasis" "SalaryBasis" NOT NULL,
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" UUID NOT NULL,

    CONSTRAINT "BusinessIncome_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BusinessIncome_companyId_year_month_deletedAt_idx" ON "BusinessIncome"("companyId", "year", "month", "deletedAt");

-- CreateIndex
CREATE INDEX "BusinessIncome_companyId_deletedAt_idx" ON "BusinessIncome"("companyId", "deletedAt");

-- AddForeignKey
ALTER TABLE "BusinessIncome" ADD CONSTRAINT "BusinessIncome_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessIncome" ADD CONSTRAINT "BusinessIncome_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
