export type CompanyProfileFieldType =
  | "text"
  | "email"
  | "phone"
  | "businessNumber"
  | "workplaceManagementNumber"
  | "textarea"
  | "boolean"
  | "password";

export type CompanyProfileFieldKey =
  | "name"
  | "firmContactName"
  | "managesPayroll"
  | "managesFourMajorInsurance"
  | "businessNumber"
  | "workplaceManagementNumber"
  | "representativeName"
  | "companyContactName"
  | "companyContactTitle"
  | "phone"
  | "mobile"
  | "fax"
  | "email"
  | "businessAddress"
  | "taxOfficeName"
  | "taxOfficeContact"
  | "certificatePassword"
  | "workersCompPhone"
  | "workersCompFax"
  | "nhisPhone"
  | "nhisFax"
  | "npsPhone"
  | "npsFax"
  | "employmentCenterPhone"
  | "employmentCenterFax"
  | "retirementPensionContact"
  | "retirementPensionPhone"
  | "notes";

export type CompanyProfileFieldDef = {
  key: CompanyProfileFieldKey;
  label: string;
  type: CompanyProfileFieldType;
  maxLength?: number;
};

export type CompanyProfileFieldGroup = {
  id: string;
  title: string;
  fields: CompanyProfileFieldDef[];
};

export type CompanyProfileSection = {
  id: string;
  title: string;
  fields?: CompanyProfileFieldDef[];
  groups?: CompanyProfileFieldGroup[];
};

export const COMPANY_PROFILE_SECTIONS: CompanyProfileSection[] = [
  {
    id: "basic",
    title: "기본 정보",
    fields: [
      { key: "name", label: "업체명", type: "text", maxLength: 100 },
      { key: "businessNumber", label: "사업자등록번호", type: "businessNumber" },
      {
        key: "workplaceManagementNumber",
        label: "사업장관리번호",
        type: "workplaceManagementNumber",
      },
      { key: "representativeName", label: "대표자", type: "text", maxLength: 50 },
      {
        key: "businessAddress",
        label: "사업장 소재지",
        type: "textarea",
        maxLength: 500,
      },
    ],
  },
  {
    id: "contacts",
    title: "담당자 정보",
    fields: [
      { key: "companyContactName", label: "이름", type: "text", maxLength: 50 },
      { key: "companyContactTitle", label: "직급", type: "text", maxLength: 50 },
      { key: "phone", label: "전화번호", type: "phone", maxLength: 20 },
      { key: "mobile", label: "핸드폰번호", type: "phone", maxLength: 20 },
      { key: "fax", label: "팩스번호", type: "phone", maxLength: 20 },
      { key: "email", label: "이메일", type: "email", maxLength: 100 },
    ],
  },
  {
    id: "management",
    title: "업무 관리",
    fields: [
      { key: "managesPayroll", label: "급여 관리", type: "boolean" },
      { key: "managesFourMajorInsurance", label: "4대보험 관리", type: "boolean" },
      { key: "taxOfficeName", label: "세무사무실", type: "text", maxLength: 100 },
      { key: "taxOfficeContact", label: "세무사무실 연락처", type: "phone", maxLength: 50 },
      { key: "certificatePassword", label: "인증서 비밀번호", type: "text", maxLength: 100 },
    ],
  },
  {
    id: "government",
    title: "관공서 연락처",
    groups: [
      {
        id: "workers-comp",
        title: "근로복지공단",
        fields: [
          { key: "workersCompPhone", label: "전화", type: "phone", maxLength: 20 },
          { key: "workersCompFax", label: "팩스", type: "phone", maxLength: 20 },
        ],
      },
      {
        id: "nhis",
        title: "건강보험공단",
        fields: [
          { key: "nhisPhone", label: "전화", type: "phone", maxLength: 20 },
          { key: "nhisFax", label: "팩스", type: "phone", maxLength: 20 },
        ],
      },
      {
        id: "nps",
        title: "연금공단",
        fields: [
          { key: "npsPhone", label: "전화", type: "phone", maxLength: 20 },
          { key: "npsFax", label: "팩스", type: "phone", maxLength: 20 },
        ],
      },
      {
        id: "employment-center",
        title: "고용센터",
        fields: [
          { key: "employmentCenterPhone", label: "전화", type: "phone", maxLength: 20 },
          { key: "employmentCenterFax", label: "팩스", type: "phone", maxLength: 20 },
        ],
      },
    ],
  },
  {
    id: "retirement",
    title: "퇴직연금",
    fields: [
      { key: "retirementPensionContact", label: "퇴직연금 담당자", type: "text", maxLength: 50 },
      { key: "retirementPensionPhone", label: "퇴직연금 연락처", type: "phone", maxLength: 20 },
    ],
  },
  {
    id: "notes",
    title: "비고",
    fields: [{ key: "notes", label: "비고", type: "textarea", maxLength: 2000 }],
  },
];

function collectSectionFields(section: CompanyProfileSection): CompanyProfileFieldDef[] {
  return [
    ...(section.fields ?? []),
    ...(section.groups?.flatMap((group) => group.fields) ?? []),
  ];
}

export const COMPANY_PROFILE_FIELD_KEYS = COMPANY_PROFILE_SECTIONS.flatMap(
  (section) => collectSectionFields(section).map((field) => field.key),
);

export const COMPANY_PROFILE_FIELD_MAP = new Map(
  COMPANY_PROFILE_SECTIONS.flatMap((section) =>
    collectSectionFields(section).map((field) => [field.key, field] as const),
  ),
);

export type CompanyProfile = {
  id: string;
  name: string;
  firmContactName: string | null;
  managesPayroll: boolean | null;
  managesFourMajorInsurance: boolean | null;
  businessNumber: string | null;
  workplaceManagementNumber: string | null;
  representativeName: string | null;
  companyContactName: string | null;
  companyContactTitle: string | null;
  phone: string | null;
  mobile: string | null;
  fax: string | null;
  email: string | null;
  businessAddress: string | null;
  taxOfficeName: string | null;
  taxOfficeContact: string | null;
  certificatePassword: string | null;
  workersCompPhone: string | null;
  workersCompFax: string | null;
  nhisPhone: string | null;
  nhisFax: string | null;
  npsPhone: string | null;
  npsFax: string | null;
  employmentCenterPhone: string | null;
  employmentCenterFax: string | null;
  retirementPensionContact: string | null;
  retirementPensionPhone: string | null;
  notes: string | null;
};
