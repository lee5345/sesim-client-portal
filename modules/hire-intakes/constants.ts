export const NON_TAXABLE_ALLOWANCE_TYPES = [
  "식대",
  "차량유지비",
  "육아수당",
  "기타",
] as const;

export type NonTaxableAllowanceType = (typeof NON_TAXABLE_ALLOWANCE_TYPES)[number];

export const KOREAN_BANKS = [
  "국민",
  "신한",
  "우리",
  "하나",
  "농협",
  "기업",
  "SC제일",
  "카카오뱅크",
  "토스뱅크",
  "대구",
  "부산",
  "광주",
  "전북",
  "경남",
  "새마을금고",
  "신협",
  "우체국",
] as const;

export const BANK_CUSTOM_VALUE = "__custom__";
