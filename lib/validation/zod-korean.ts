const ENGLISH_MESSAGE_PATTERNS: Array<[RegExp, string]> = [
  [/invalid email/i, "올바른 이메일 형식이 아닙니다."],
  [/invalid option/i, "올바른 값을 선택해 주세요."],
  [/invalid input/i, "입력값을 확인해 주세요."],
  [/invalid date/i, "올바른 날짜를 입력해 주세요."],
  [/expected number/i, "숫자를 입력해 주세요."],
  [/expected string/i, "텍스트를 입력해 주세요."],
  [/required/i, "필수 항목입니다."],
  [/too small/i, "값이 너무 작습니다."],
  [/too big/i, "값이 너무 큽니다."],
];

export function translateZodErrorMessage(message: string): string {
  if (/[가-힣]/.test(message)) {
    return message;
  }

  for (const [pattern, korean] of ENGLISH_MESSAGE_PATTERNS) {
    if (pattern.test(message)) {
      return korean;
    }
  }

  return "입력값을 확인해 주세요.";
}
