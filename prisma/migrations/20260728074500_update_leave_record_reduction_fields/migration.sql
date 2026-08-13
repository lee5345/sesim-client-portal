ALTER TABLE "LeaveRecord"
  ALTER COLUMN "hoursBeforeReduction" TYPE DECIMAL(4, 1)
  USING "hoursBeforeReduction"::DECIMAL(4, 1),
  ALTER COLUMN "hoursAfterReduction" TYPE DECIMAL(4, 1)
  USING "hoursAfterReduction"::DECIMAL(4, 1),
  ADD COLUMN "salaryBeforeReduction" INTEGER,
  ADD COLUMN "salaryAfterReduction" INTEGER;
