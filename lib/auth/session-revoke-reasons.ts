export const SESSION_REVOKE_REASONS = [
  "deactivated",
  "deleted",
  "role_changed",
  "company_removed",
] as const;

export type SessionRevokeReason = (typeof SESSION_REVOKE_REASONS)[number];

export function isSessionRevokeReason(
  value: string | null | undefined,
): value is SessionRevokeReason {
  return (
    value !== null &&
    value !== undefined &&
    (SESSION_REVOKE_REASONS as readonly string[]).includes(value)
  );
}

export function getSessionRevokeMessage(reason: SessionRevokeReason): string {
  switch (reason) {
    case "deactivated":
      return "관리자에 의해 계정이 비활성화되어 로그아웃되었습니다.";
    case "deleted":
      return "계정이 삭제되어 로그아웃되었습니다.";
    case "role_changed":
      return "계정 권한이 변경되어 로그아웃되었습니다. 변경된 권한으로 다시 로그인해 주세요.";
    case "company_removed":
      return "소속 회사가 비활성화되거나 삭제되어 로그아웃되었습니다.";
    default:
      return "접근 권한이 변경되어 로그아웃되었습니다.";
  }
}
