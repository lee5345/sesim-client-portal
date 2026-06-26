import type { RetirementPayType } from "@/lib/generated/prisma/client";

export type TerminationTableRow = {
  id: string;
  name: string;
  maskedRrn: string;
  hireDate: Date | null;
  terminationDate: Date;
  reason: string;
  retirementPayType: RetirementPayType;
  notes: string | null;
  createdAt: Date;
  createdByName: string;
};
