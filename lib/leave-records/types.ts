import type { LeaveType } from "@/lib/generated/prisma/client";

export type LeaveRecordTableRow = {
  id: string;
  name: string;
  leaveType: LeaveType;
  periodStart: string;
  periodEnd: string;
  expectedDeliveryDate: string | null;
  childName: string | null;
  maskedChildRrn: string | null;
  hoursBeforeReduction: number | null;
  hoursAfterReduction: number | null;
  attachments: { id: string; filename: string }[];
  createdAt: string;
  createdByName: string;
};
