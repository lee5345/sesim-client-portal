export type DependentRecordTableRow = {
  id: string;
  employeeName: string;
  dependentName: string;
  relationship: string;
  registrationRequestedDate: string;
  attachments: { id: string; filename: string }[];
  createdAt: string;
  createdByName: string;
};
