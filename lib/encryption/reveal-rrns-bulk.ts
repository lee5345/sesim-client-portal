import "server-only";
import { z } from "zod";

import { decryptRRN } from "@/lib/encryption/rrn";

export const rrnRecordIdsSchema = z.array(z.string().uuid());

type RrnRecord = {
  id: string;
  rrnEncrypted: string;
  rrnIv: string;
};

export function decryptRrnsForIds(
  records: RrnRecord[],
  requestedIds: string[],
  notFoundMessage: string,
): Record<string, string> {
  if (requestedIds.length === 0) {
    return {};
  }

  const recordsById = new Map(records.map((record) => [record.id, record]));
  const revealedById: Record<string, string> = {};

  for (const id of requestedIds) {
    const record = recordsById.get(id);
    if (!record) {
      throw new Error(notFoundMessage);
    }

    revealedById[id] = decryptRRN(record.rrnEncrypted, record.rrnIv);
  }

  return revealedById;
}
