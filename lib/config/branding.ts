export function getFirmName(): string {
  return process.env.NEXT_PUBLIC_FIRM_NAME ?? "세심 노무 컨설팅";
}

export function getFirmTagline(): string {
  return process.env.NEXT_PUBLIC_FIRM_TAGLINE ?? "고객사 HR 데이터 포털";
}