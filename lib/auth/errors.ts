import { CredentialsSignin } from "next-auth";

export const LOGIN_ERROR_DEACTIVATED = "deactivated" as const;

export class DeactivatedAccountError extends CredentialsSignin {
  code = LOGIN_ERROR_DEACTIVATED;
}

export function getLoginErrorMessage(error: string | undefined): string | null {
  if (error === LOGIN_ERROR_DEACTIVATED) {
    return "계정이 비활성화되었습니다. 사무소 관리자에게 문의해 주세요.";
  }

  if (error === "1") {
    return "로그인에 실패했습니다. 이메일과 비밀번호를 확인해 주세요.";
  }

  return null;
}

export class ForbiddenError extends Error {
  readonly status = 403;

  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class EmailDeliveryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailDeliveryError";
  }
}

export class PasswordSetupTokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PasswordSetupTokenError";
  }
}

export class PasswordSetupTokenExpiredError extends PasswordSetupTokenError {
  constructor() {
    super("Password setup token expired");
    this.name = "PasswordSetupTokenExpiredError";
  }
}

export class PasswordSetupTokenUsedError extends PasswordSetupTokenError {
  constructor() {
    super("Password setup token already used");
    this.name = "PasswordSetupTokenUsedError";
  }
}

export class PasswordSetupTokenInvalidError extends PasswordSetupTokenError {
  constructor() {
    super("Password setup token invalid");
    this.name = "PasswordSetupTokenInvalidError";
  }
}

export class PasswordResetTokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PasswordResetTokenError";
  }
}

export class PasswordResetTokenExpiredError extends PasswordResetTokenError {
  constructor() {
    super("Password reset token expired");
    this.name = "PasswordResetTokenExpiredError";
  }
}

export class PasswordResetTokenUsedError extends PasswordResetTokenError {
  constructor() {
    super("Password reset token already used");
    this.name = "PasswordResetTokenUsedError";
  }
}

export class PasswordResetTokenInvalidError extends PasswordResetTokenError {
  constructor() {
    super("Password reset token invalid");
    this.name = "PasswordResetTokenInvalidError";
  }
}

