export type OfficeTaskUserSummary = {
  id: string;
  name: string;
};

export type OfficeTaskCompanySummary = {
  id: string;
  name: string;
  isActive: boolean;
};

export type OfficeTaskTableRow = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  dueTime: string | null;
  hasDueTime: boolean;
  dueAtIso: string;
  company: OfficeTaskCompanySummary | null;
  createdBy: OfficeTaskUserSummary;
  completedBy: OfficeTaskUserSummary | null;
  completedAtIso: string | null;
  assignees: OfficeTaskUserSummary[];
  isOverdue: boolean;
  createdAt: string;
};

export type OfficeTaskStaffOption = {
  id: string;
  name: string;
  role: "FIRM_STAFF" | "FIRM_ADMIN";
  isActive: boolean;
};

export type OfficeTaskCompanyOption = {
  id: string;
  name: string;
  isActive: boolean;
};
