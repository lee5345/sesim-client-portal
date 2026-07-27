export type DependentRecordTableRow = {
  id: string;
  employeeName: string;
  dependentName: string;
  relationship: string;
  registrationRequestedDate: string;
  notes: string | null;
  attachments: { id: string; filename: string }[];
  createdAt: string;
  createdByName: string;
};
