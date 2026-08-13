-- CreateTable
CREATE TABLE "OfficeTask" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "hasDueTime" BOOLEAN NOT NULL DEFAULT false,
    "companyId" UUID,
    "createdById" UUID NOT NULL,
    "completedAt" TIMESTAMP(3),
    "completedById" UUID,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfficeTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficeTaskAssignee" (
    "taskId" UUID NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "OfficeTaskAssignee_pkey" PRIMARY KEY ("taskId","userId")
);

-- CreateIndex
CREATE INDEX "OfficeTask_deletedAt_completedAt_dueAt_idx" ON "OfficeTask"("deletedAt", "completedAt", "dueAt");

-- CreateIndex
CREATE INDEX "OfficeTask_createdById_idx" ON "OfficeTask"("createdById");

-- CreateIndex
CREATE INDEX "OfficeTask_companyId_idx" ON "OfficeTask"("companyId");

-- CreateIndex
CREATE INDEX "OfficeTaskAssignee_userId_idx" ON "OfficeTaskAssignee"("userId");

-- AddForeignKey
ALTER TABLE "OfficeTask" ADD CONSTRAINT "OfficeTask_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficeTask" ADD CONSTRAINT "OfficeTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficeTask" ADD CONSTRAINT "OfficeTask_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficeTaskAssignee" ADD CONSTRAINT "OfficeTaskAssignee_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "OfficeTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficeTaskAssignee" ADD CONSTRAINT "OfficeTaskAssignee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
