-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CLIENT_ADMIN', 'FIRM_STAFF', 'FIRM_ADMIN');

-- CreateEnum
CREATE TYPE "SalaryType" AS ENUM ('ANNUAL', 'MONTHLY', 'DAILY', 'HOURLY');

-- CreateEnum
CREATE TYPE "SalaryBasis" AS ENUM ('GROSS', 'NET');

-- CreateEnum
CREATE TYPE "RetirementPayType" AS ENUM ('NOT_APPLICABLE', 'SEVERANCE_PAY', 'SEVERANCE_PENSION');

-- CreateEnum
CREATE TYPE "DailyWorkerOccupation" AS ENUM ('MEDICAL_DOCTOR', 'VETERINARIAN', 'PHARMACIST', 'NURSE', 'NUTRITIONIST', 'MEDICAL_TECHNICIAN', 'HEALTHCARE_WORKER');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'LOGIN');

-- CreateEnum
CREATE TYPE "RegistrationRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TenantChangeEntityType" AS ENUM ('NEW_HIRE', 'TERMINATION', 'DAILY_WORKER', 'COMPANY_PROFILE', 'DEPARTMENT');

-- CreateEnum
CREATE TYPE "TenantChangeAudience" AS ENUM ('FIRM', 'CLIENT');

-- CreateTable
CREATE TABLE "Company" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "businessNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "businessAddress" TEXT,
    "certificatePassword" TEXT,
    "companyContactName" TEXT,
    "companyContactTitle" TEXT,
    "email" TEXT,
    "employmentCenterFax" TEXT,
    "employmentCenterPhone" TEXT,
    "fax" TEXT,
    "firmContactName" TEXT,
    "mobile" TEXT,
    "nhisFax" TEXT,
    "nhisPhone" TEXT,
    "notes" TEXT,
    "npsFax" TEXT,
    "npsPhone" TEXT,
    "phone" TEXT,
    "representativeName" TEXT,
    "retirementPensionContact" TEXT,
    "retirementPensionPhone" TEXT,
    "taxOfficeContact" TEXT,
    "taxOfficeName" TEXT,
    "workersCompFax" TEXT,
    "workersCompPhone" TEXT,
    "workplaceManagementNumber" TEXT,
    "managesFourMajorInsurance" BOOLEAN,
    "managesPayroll" BOOLEAN,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "companyId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistrationRequest" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "phone" TEXT,
    "note" TEXT,
    "status" "RegistrationRequestStatus" NOT NULL DEFAULT 'PENDING',
    "companyId" UUID,
    "reviewedById" UUID,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistrationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordSetupToken" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordSetupToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewHire" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "rrnEncrypted" TEXT NOT NULL,
    "rrnIv" TEXT NOT NULL,
    "hireDate" TIMESTAMP(3) NOT NULL,
    "department" TEXT,
    "salaryType" "SalaryType" NOT NULL,
    "salaryBasis" "SalaryBasis" NOT NULL,
    "salaryAmount" INTEGER NOT NULL,
    "isContract" BOOLEAN NOT NULL DEFAULT false,
    "contractStart" TIMESTAMP(3),
    "contractEnd" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" UUID NOT NULL,
    "email" TEXT,
    "accountNumber" TEXT,
    "bankName" TEXT,
    "nonTaxableAllowances" JSONB,
    "notes" TEXT,
    "phone" TEXT,

    CONSTRAINT "NewHire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Termination" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "rrnEncrypted" TEXT NOT NULL,
    "rrnIv" TEXT NOT NULL,
    "terminationDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" UUID NOT NULL,
    "hireDate" TIMESTAMP(3),
    "retirementPayType" "RetirementPayType" NOT NULL,
    "notes" TEXT,

    CONSTRAINT "Termination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompensationChange" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "rrnEncrypted" TEXT NOT NULL,
    "rrnIv" TEXT NOT NULL,
    "salaryTypeBefore" "SalaryType" NOT NULL,
    "salaryBasisBefore" "SalaryBasis" NOT NULL,
    "salaryAmountBefore" INTEGER NOT NULL,
    "salaryTypeAfter" "SalaryType" NOT NULL,
    "salaryBasisAfter" "SalaryBasis" NOT NULL,
    "salaryAmountAfter" INTEGER NOT NULL,
    "changeDate" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" UUID NOT NULL,

    CONSTRAINT "CompensationChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyWorker" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "rrnEncrypted" TEXT NOT NULL,
    "rrnIv" TEXT NOT NULL,
    "occupation" "DailyWorkerOccupation" NOT NULL,
    "occupationCode" TEXT NOT NULL,
    "hoursDay1" DECIMAL(4,1),
    "hoursDay2" DECIMAL(4,1),
    "hoursDay3" DECIMAL(4,1),
    "hoursDay4" DECIMAL(4,1),
    "hoursDay5" DECIMAL(4,1),
    "hoursDay6" DECIMAL(4,1),
    "hoursDay7" DECIMAL(4,1),
    "hoursDay8" DECIMAL(4,1),
    "hoursDay9" DECIMAL(4,1),
    "hoursDay10" DECIMAL(4,1),
    "hoursDay11" DECIMAL(4,1),
    "hoursDay12" DECIMAL(4,1),
    "hoursDay13" DECIMAL(4,1),
    "hoursDay14" DECIMAL(4,1),
    "hoursDay15" DECIMAL(4,1),
    "hoursDay16" DECIMAL(4,1),
    "hoursDay17" DECIMAL(4,1),
    "hoursDay18" DECIMAL(4,1),
    "hoursDay19" DECIMAL(4,1),
    "hoursDay20" DECIMAL(4,1),
    "hoursDay21" DECIMAL(4,1),
    "hoursDay22" DECIMAL(4,1),
    "hoursDay23" DECIMAL(4,1),
    "hoursDay24" DECIMAL(4,1),
    "hoursDay25" DECIMAL(4,1),
    "hoursDay26" DECIMAL(4,1),
    "hoursDay27" DECIMAL(4,1),
    "hoursDay28" DECIMAL(4,1),
    "hoursDay29" DECIMAL(4,1),
    "hoursDay30" DECIMAL(4,1),
    "hoursDay31" DECIMAL(4,1),
    "daysWorked" INTEGER NOT NULL DEFAULT 0,
    "avgHoursPerDay" INTEGER NOT NULL DEFAULT 0,
    "salaryBasis" "SalaryBasis" NOT NULL,
    "totalWage" INTEGER NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" UUID NOT NULL,
    "notes" TEXT,

    CONSTRAINT "DailyWorker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortalSyncCursor" (
    "scope" TEXT NOT NULL,
    "version" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortalSyncCursor_pkey" PRIMARY KEY ("scope")
);

-- CreateTable
CREATE TABLE "TenantChange" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "entityType" "TenantChangeEntityType" NOT NULL,
    "entityId" UUID,
    "action" "AuditAction" NOT NULL,
    "audience" "TenantChangeAudience" NOT NULL,
    "actorId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantChangeReadCursor" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "entityType" "TenantChangeEntityType" NOT NULL,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantChangeReadCursor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "action" "AuditAction" NOT NULL,
    "tableName" TEXT NOT NULL,
    "recordId" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Company_deletedAt_idx" ON "Company"("deletedAt");

-- CreateIndex
CREATE INDEX "Department_companyId_deletedAt_idx" ON "Department"("companyId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_companyId_idx" ON "User"("companyId");

-- CreateIndex
CREATE INDEX "RegistrationRequest_email_status_idx" ON "RegistrationRequest"("email", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordSetupToken_token_key" ON "PasswordSetupToken"("token");

-- CreateIndex
CREATE INDEX "PasswordSetupToken_userId_idx" ON "PasswordSetupToken"("userId");

-- CreateIndex
CREATE INDEX "NewHire_companyId_idx" ON "NewHire"("companyId");

-- CreateIndex
CREATE INDEX "NewHire_companyId_deletedAt_idx" ON "NewHire"("companyId", "deletedAt");

-- CreateIndex
CREATE INDEX "Termination_companyId_idx" ON "Termination"("companyId");

-- CreateIndex
CREATE INDEX "Termination_companyId_deletedAt_idx" ON "Termination"("companyId", "deletedAt");

-- CreateIndex
CREATE INDEX "CompensationChange_companyId_idx" ON "CompensationChange"("companyId");

-- CreateIndex
CREATE INDEX "CompensationChange_companyId_deletedAt_idx" ON "CompensationChange"("companyId", "deletedAt");

-- CreateIndex
CREATE INDEX "DailyWorker_companyId_year_month_deletedAt_idx" ON "DailyWorker"("companyId", "year", "month", "deletedAt");

-- CreateIndex
CREATE INDEX "DailyWorker_companyId_deletedAt_idx" ON "DailyWorker"("companyId", "deletedAt");

-- CreateIndex
CREATE INDEX "TenantChange_companyId_audience_entityType_createdAt_idx" ON "TenantChange"("companyId", "audience", "entityType", "createdAt");

-- CreateIndex
CREATE INDEX "TenantChange_audience_createdAt_idx" ON "TenantChange"("audience", "createdAt");

-- CreateIndex
CREATE INDEX "TenantChangeReadCursor_userId_companyId_idx" ON "TenantChangeReadCursor"("userId", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantChangeReadCursor_userId_companyId_entityType_key" ON "TenantChangeReadCursor"("userId", "companyId", "entityType");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_companyId_idx" ON "AuditLog"("companyId");

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationRequest" ADD CONSTRAINT "RegistrationRequest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationRequest" ADD CONSTRAINT "RegistrationRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordSetupToken" ADD CONSTRAINT "PasswordSetupToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewHire" ADD CONSTRAINT "NewHire_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewHire" ADD CONSTRAINT "NewHire_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Termination" ADD CONSTRAINT "Termination_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Termination" ADD CONSTRAINT "Termination_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompensationChange" ADD CONSTRAINT "CompensationChange_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompensationChange" ADD CONSTRAINT "CompensationChange_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyWorker" ADD CONSTRAINT "DailyWorker_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyWorker" ADD CONSTRAINT "DailyWorker_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantChange" ADD CONSTRAINT "TenantChange_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantChange" ADD CONSTRAINT "TenantChange_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantChangeReadCursor" ADD CONSTRAINT "TenantChangeReadCursor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

