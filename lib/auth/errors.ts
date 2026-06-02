export class ForbiddenError extends Error {
  readonly status = 403;

  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
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

