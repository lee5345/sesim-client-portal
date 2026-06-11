import { beforeAll, describe, expect, it } from "vitest";
import {
  RRNDecryptionError,
  decryptRRN,
  encryptRRN,
  maskRRN,
} from "./rrn";

const SAMPLE_RRN = "900101-1234567";

describe("encryptRRN / decryptRRN", () => {
  beforeAll(() => {
    if (!process.env.ENCRYPTION_KEY) {
      throw new Error("ENCRYPTION_KEY must be set for RRN encryption tests");
    }
  });

  it("round-trips plaintext", () => {
    const { encrypted, iv } = encryptRRN(SAMPLE_RRN);
    expect(decryptRRN(encrypted, iv)).toBe(SAMPLE_RRN);
  });

  it("produces different ciphertexts for the same input", () => {
    const first = encryptRRN(SAMPLE_RRN);
    const second = encryptRRN(SAMPLE_RRN);
    expect(first.encrypted).not.toBe(second.encrypted);
    expect(first.iv).not.toBe(second.iv);
  });

  it("throws RRNDecryptionError for tampered ciphertext", () => {
    const { encrypted, iv } = encryptRRN(SAMPLE_RRN);
    const tampered = Buffer.from(encrypted, "base64");
    tampered[0] ^= 0xff;
    expect(() =>
      decryptRRN(tampered.toString("base64"), iv),
    ).toThrow(RRNDecryptionError);
  });

  it("throws RRNDecryptionError for wrong IV", () => {
    const { encrypted } = encryptRRN(SAMPLE_RRN);
    const wrongIv = Buffer.alloc(12, 0).toString("base64");
    expect(() => decryptRRN(encrypted, wrongIv)).toThrow(RRNDecryptionError);
  });
});

describe("maskRRN", () => {
  it("masks RRN without hyphen", () => {
    expect(maskRRN("9001011234567")).toBe("900101-1******");
  });

  it("masks RRN with hyphen", () => {
    expect(maskRRN("900101-1234567")).toBe("900101-1******");
  });

  it("returns fallback for unexpected format", () => {
    expect(maskRRN("invalid")).toBe("******-*******");
    expect(maskRRN("12345")).toBe("******-*******");
    expect(maskRRN("")).toBe("******-*******");
  });
});
