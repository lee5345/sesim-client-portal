-- CreateTable
CREATE TABLE "TenantChangePeriodReadCursor" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "entityType" "TenantChangeEntityType" NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantChangePeriodReadCursor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TenantChangePeriodReadCursor_userId_companyId_idx" ON "TenantChangePeriodReadCursor"("userId", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantChangePeriodReadCursor_userId_companyId_entityType_pe_key" ON "TenantChangePeriodReadCursor"("userId", "companyId", "entityType", "periodYear", "periodMonth");

-- AddForeignKey
ALTER TABLE "TenantChangePeriodReadCursor" ADD CONSTRAINT "TenantChangePeriodReadCursor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
