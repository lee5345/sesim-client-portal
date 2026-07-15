import nodemailer from "nodemailer";

import { EmailDeliveryError } from "@/lib/auth/errors";

export type SendEmailResult = { ok: true } | { ok: false; message: string };

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user) {
    throw new EmailDeliveryError("GMAIL_USER is not set");
  }
  if (!pass) {
    throw new EmailDeliveryError("GMAIL_APP_PASSWORD is not set");
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
}

async function sendMail(options: {
  to: string;
  subject: string;
  html: string;
  logLabel: string;
}): Promise<SendEmailResult> {
  try {
    const fromEmail = process.env.GMAIL_USER;
    if (!fromEmail) {
      throw new EmailDeliveryError("GMAIL_USER is not set");
    }

    const info = await getTransporter().sendMail({
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (!info.messageId) {
      throw new EmailDeliveryError("Email send failed with no message id");
    }

    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown email delivery error";
    console.error(`[${options.logLabel}] Nodemailer error`, {
      to: options.to,
      message,
    });
    return { ok: false, message };
  }
}

export async function sendPasswordSetupEmail(
  to: string,
  setupUrl: string,
): Promise<SendEmailResult> {
  return sendMail({
    to,
    logLabel: "sendPasswordSetupEmail",
    subject: "[세심노무컨설팅] 고객사 관리자 계정 생성 안내",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Noto Sans KR', Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height: 1.6;">
        <h2 style="margin: 0 0 12px;">비밀번호 설정 안내</h2>
        <p style="margin: 0 0 12px;">
          세심 노무 컨설팅 포털에 가입해주셔서 감사합니다. <br />
          아래 링크를 눌러 비밀번호를 설정해 주세요.
          <strong>이 링크는 발급 시점부터 24시간 동안만 유효</strong>합니다.
        </p>
        <p style="margin: 0 0 16px;">
          <a href="${setupUrl}" style="display: inline-block; padding: 10px 14px; background: #111827; color: #ffffff; text-decoration: none; border-radius: 6px;">
            비밀번호 설정하기
          </a>
        </p>
        <p style="margin: 0 0 6px; color: #6b7280; font-size: 14px;">링크가 클릭되지 않으면 아래 주소를 복사해 브라우저에 붙여넣어 주세요.</p>
        <p style="margin: 0; color: #111827; font-size: 14px; word-break: break-all;">${setupUrl}</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
): Promise<SendEmailResult> {
  return sendMail({
    to,
    logLabel: "sendPasswordResetEmail",
    subject: "[세심노무컨설팅] 비밀번호 재설정 안내",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Noto Sans KR', Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height: 1.6;">
        <h2 style="margin: 0 0 12px;">비밀번호 재설정 안내</h2>
        <p style="margin: 0 0 12px;">
          비밀번호 재설정을 요청하셨습니다. 아래 링크를 눌러 새 비밀번호를 설정해 주세요.
          <strong>이 링크는 발급 시점부터 1시간 동안만 유효</strong>합니다.
        </p>
        <p style="margin: 0 0 16px;">
          <a href="${resetUrl}" style="display: inline-block; padding: 10px 14px; background: #111827; color: #ffffff; text-decoration: none; border-radius: 6px;">
            비밀번호 재설정하기
          </a>
        </p>
        <p style="margin: 0 0 12px; color: #6b7280; font-size: 14px;">
          본인이 요청하지 않았다면 이 메일을 무시해 주세요.
        </p>
        <p style="margin: 0 0 6px; color: #6b7280; font-size: 14px;">링크가 클릭되지 않으면 아래 주소를 복사해 브라우저에 붙여넣어 주세요.</p>
        <p style="margin: 0; color: #111827; font-size: 14px; word-break: break-all;">${resetUrl}</p>
      </div>
    `,
  });
}
