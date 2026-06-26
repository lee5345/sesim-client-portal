import type { DailyWorkerOccupation, SalaryBasis } from "@/lib/generated/prisma/client";
import type { DailyHoursInput } from "@/lib/daily-workers/calculations";

export type DailyWorkerTableRow = {
  id: string;
  year: number;
  month: number;
  name: string;
  maskedRrn: string;
  occupation: DailyWorkerOccupation;
  occupationCode: string;
  hours: DailyHoursInput;
  daysWorked: number;
  avgHoursPerDay: number;
  salaryBasis: SalaryBasis;
  totalWage: number;
  notes: string | null;
  createdAt: Date;
  createdByName: string;
};
