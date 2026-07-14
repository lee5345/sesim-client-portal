import type { SalaryBasis } from "@/lib/generated/prisma/client";

export type BusinessIncomeTableRow = {
  id: string;
  year: number;
  month: number;
  name: string;
  maskedRrn: string;
  incomeAmount: number;
  incomeBasis: SalaryBasis;
  notes: string | null;
  createdAt: Date;
  createdByName: string;
};
