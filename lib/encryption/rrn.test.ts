import { beforeAll, describe, expect, it } from "vitest";
import {
  RRNDecryptionError,
  decryptRRN,
  encryptRRN,
  maskRRN,
} from "./rrn";
import { decryptRrnsForIds } from "./reveal-rrns-bulk";

const SAMPLE_RRN = "900101-1234567";
const OTHER_RRN = "800202-2345678";

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

describe("decryptRrnsForIds", () => {
  beforeAll(() => {
    if (!process.env.ENCRYPTION_KEY) {
      throw new Error("ENCRYPTION_KEY must be set for RRN encryption tests");
    }
  });

  it("returns an empty map for no requested ids", () => {
    expect(decryptRrnsForIds([], [], "not found")).toEqual({});
  });

  it("decrypts requested records by id", () => {
    const first = encryptRRN(SAMPLE_RRN);
    const second = encryptRRN(OTHER_RRN);

    const revealed = decryptRrnsForIds(
      [
        {
          id: "11111111-1111-4111-8111-111111111111",
          rrnEncrypted: first.encrypted,
          rrnIv: first.iv,
        },
        {
          id: "22222222-2222-4222-8222-222222222222",
          rrnEncrypted: second.encrypted,
          rrnIv: second.iv,
        },
      ],
      [
        "11111111-1111-4111-8111-111111111111",
        "22222222-2222-4222-8222-222222222222",
      ],
      "not found",
    );

    expect(revealed).toEqual({
      "11111111-1111-4111-8111-111111111111": SAMPLE_RRN,
      "22222222-2222-4222-8222-222222222222": OTHER_RRN,
    });
  });

  it("throws when a requested id is missing", () => {
    const { encrypted, iv } = encryptRRN(SAMPLE_RRN);

    expect(() =>
      decryptRrnsForIds(
        [
          {
            id: "11111111-1111-4111-8111-111111111111",
            rrnEncrypted: encrypted,
            rrnIv: iv,
          },
        ],
        [
          "11111111-1111-4111-8111-111111111111",
          "22222222-2222-4222-8222-222222222222",
        ],
        "record missing",
      ),
    ).toThrow("record missing");
  });
});
