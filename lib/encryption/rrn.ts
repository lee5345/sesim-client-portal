import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import "server-only";

if (!process.env.ENCRYPTION_KEY) {
  throw new Error("ENCRYPTION_KEY environment variable is not set");
}

const AUTH_TAG_LENGTH = 16;
const IV_LENGTH = 12;
const MASK_FALLBACK = "******-*******";

function getKey(): Buffer {
  return Buffer.from(process.env.ENCRYPTION_KEY!, "hex");
}

export class RRNDecryptionError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "RRNDecryptionError";
    if (options?.cause) {
      this.cause = options.cause;
    }
  }
}

export function encryptRRN(plaintext: string): { encrypted: string; iv: string } {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const ciphertextWithTag = Buffer.concat([ciphertext, cipher.getAuthTag()]);
  return {
    encrypted: ciphertextWithTag.toString("base64"),
    iv: iv.toString("base64"),
  };
}

export function decryptRRN(encrypted: string, iv: string): string {
  try {
    const ciphertextWithTag = Buffer.from(encrypted, "base64");
    if (ciphertextWithTag.length < AUTH_TAG_LENGTH) {
      throw new RRNDecryptionError("Invalid ciphertext");
    }

    const authTag = ciphertextWithTag.subarray(
      ciphertextWithTag.length - AUTH_TAG_LENGTH,
    );
    const ciphertext = ciphertextWithTag.subarray(
      0,
      ciphertextWithTag.length - AUTH_TAG_LENGTH,
    );
    const ivBuffer = Buffer.from(iv, "base64");

    const decipher = createDecipheriv("aes-256-gcm", getKey(), ivBuffer);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch (error) {
    if (error instanceof RRNDecryptionError) {
      throw error;
    }
    throw new RRNDecryptionError("Failed to decrypt RRN", { cause: error });
  }
}

export function maskRRN(plaintext: string): string {
  const digits = plaintext.replace(/-/g, "");
  if (!/^\d{13}$/.test(digits)) {
    return MASK_FALLBACK;
  }
  return `${digits.slice(0, 6)}-${digits[6]}******`;
}
