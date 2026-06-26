"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { DailyHoursInput } from "@/lib/daily-workers/calculations";
import { prisma } from "@/lib/db/db";
import { decryptRRN, encryptRRN, maskRRN } from "@/lib/encryption/rrn";
import type { Prisma } from "@/lib/generated/prisma/client";
import {
  isFirmRole,
  parseOptionalCompanyId,
  requireDataEditAuth,
  resolveCompanyId,
} from "@/lib/permissions/crud";
import {
  type CreateDailyWorkerInput,
  type DailyWorkerCoreInput,
  normalizeRRN,
  parseCreateDailyWorkerFormData,
  parseUpdateDailyWorkerFormData,
  toDailyWorkerAuditPayload,
} from "@/lib/validation/daily-worker";
import { DAILY_HOUR_FIELD_NAMES } from "@/modules/daily-workers/constants";

const CLIENT_DAILY_WORKERS_PATH = "/client/daily-workers";

export type DailyWorkerActionResult =
  | { success: true }
  | { success: false; error: string };

const idSchema = z.object({
  id: z.string().uuid(),
});

const periodSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

function revalidateDailyWorkerPaths(
  companyId: string,
  role: Awaited<ReturnType<typeof requireDataEditAuth>>["user"]["role"],
) {
  if (isFirmRole(role)) {
    revalidatePath(`/firm/companies/${companyId}`);
  } else {
    revalidatePath(CLIENT_DAILY_WORKERS_PATH);
  }
}

function decimalToHours(value: { toNumber(): number } | null): number | null {
  if (value === null) {
    return null;
  }

  return Math.round(value.toNumber() * 10) / 10;
}

type HoursFieldName = (typeof DAILY_HOUR_FIELD_NAMES)[number];
type HoursDbRecord = { [K in HoursFieldName]: { toNumber(): number } | null };

function hoursToRecord(
  record: HoursDbRecord,
): DailyHoursInput {
  return Object.fromEntries(
    DAILY_HOUR_FIELD_NAMES.map((fieldName) => [
      fieldName,
      decimalToHours(record[fieldName] ?? null),
    ]),
  ) as DailyHoursInput;
}

function hoursToDbData(hours: DailyHoursInput) {
  return Object.fromEntries(
    DAILY_HOUR_FIELD_NAMES.map((fieldName) => [
      fieldName,
      hours[fieldName],
    ]),
  );
}

function toDailyWorkerData(input: Omit<CreateDailyWorkerInput, "rrn">) {
  return {
    year: input.year,
    month: input.month,
    name: input.name,
    occupation: input.occupation,
    occupationCode: input.occupationCode,
    ...hoursToDbData(input.hours),
    daysWorked: input.daysWorked,
    avgHoursPerDay: input.avgHoursPerDay,
    salaryBasis: input.salaryBasis,
    totalWage: input.totalWage,
    notes: input.notes ?? null,
  };
}

async function getOwnedDailyWorker(id: string, companyId: string) {
  const record = await prisma.dailyWorker.findFirst({
    where: { id, companyId, deletedAt: null },
  });

  if (!record) {
    throw new Error("일용직 정보를 찾을 수 없습니다.");
  }

  return record;
}

const dailyWorkerSelect = {
  id: true,
  year: true,
  month: true,
  name: true,
  rrnEncrypted: true,
  rrnIv: true,
  occupation: true,
  occupationCode: true,
  hoursDay1: true,
  hoursDay2: true,
  hoursDay3: true,
  hoursDay4: true,
  hoursDay5: true,
  hoursDay6: true,
  hoursDay7: true,
  hoursDay8: true,
  hoursDay9: true,
  hoursDay10: true,
  hoursDay11: true,
  hoursDay12: true,
  hoursDay13: true,
  hoursDay14: true,
  hoursDay15: true,
  hoursDay16: true,
  hoursDay17: true,
  hoursDay18: true,
  hoursDay19: true,
  hoursDay20: true,
  hoursDay21: true,
  hoursDay22: true,
  hoursDay23: true,
  hoursDay24: true,
  hoursDay25: true,
  hoursDay26: true,
  hoursDay27: true,
  hoursDay28: true,
  hoursDay29: true,
  hoursDay30: true,
  hoursDay31: true,
  daysWorked: true,
  avgHoursPerDay: true,
  salaryBasis: true,
  totalWage: true,
  notes: true,
  createdAt: true,
  createdBy: {
    select: { name: true },
  },
} as const satisfies Prisma.DailyWorkerSelect;

type DailyWorkerDbRecord = Prisma.DailyWorkerGetPayload<{
  select: typeof dailyWorkerSelect;
}>;

function mapDailyWorkerRecord(
  record: DailyWorkerDbRecord,
) {
  const recordWithHours = record as typeof record & HoursDbRecord;
  const plaintext = decryptRRN(record.rrnEncrypted, record.rrnIv);
  const hours = hoursToRecord(
    Object.fromEntries(
      DAILY_HOUR_FIELD_NAMES.map((fieldName) => [
        fieldName,
        recordWithHours[fieldName],
      ]),
    ) as HoursDbRecord,
  );
  const {
    rrnEncrypted: _encrypted,
    rrnIv: _iv,
    createdBy,
    hoursDay1: _1,
    hoursDay2: _2,
    hoursDay3: _3,
    hoursDay4: _4,
    hoursDay5: _5,
    hoursDay6: _6,
    hoursDay7: _7,
    hoursDay8: _8,
    hoursDay9: _9,
    hoursDay10: _10,
    hoursDay11: _11,
    hoursDay12: _12,
    hoursDay13: _13,
    hoursDay14: _14,
    hoursDay15: _15,
    hoursDay16: _16,
    hoursDay17: _17,
    hoursDay18: _18,
    hoursDay19: _19,
    hoursDay20: _20,
    hoursDay21: _21,
    hoursDay22: _22,
    hoursDay23: _23,
    hoursDay24: _24,
    hoursDay25: _25,
    hoursDay26: _26,
    hoursDay27: _27,
    hoursDay28: _28,
    hoursDay29: _29,
    hoursDay30: _30,
    hoursDay31: _31,
    ...rest
  } = record;

  return {
    ...rest,
    hours,
    createdByName: createdBy.name,
    maskedRrn: maskRRN(plaintext),
  };
}

export async function listDailyWorkers(
  companyId: string,
  year: number,
  month: number,
) {
  const session = await requireDataEditAuth();
  resolveCompanyId(session, companyId);
  const period = periodSchema.parse({ year, month });

  const records = await prisma.dailyWorker.findMany({
    where: {
      companyId,
      year: period.year,
      month: period.month,
      deletedAt: null,
    },
    orderBy: [{ name: "asc" }, { createdAt: "asc" }],
    select: dailyWorkerSelect,
  });

  return records.map(mapDailyWorkerRecord);
}

export async function createDailyWorker(
  formData: FormData,
): Promise<DailyWorkerActionResult> {
  const session = await requireDataEditAuth();
  const companyId = resolveCompanyId(
    session,
    parseOptionalCompanyId(formData),
  );
  const parsed = parseCreateDailyWorkerFormData(formData);

  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }

  const input = parsed.data;
  const { encrypted, iv } = encryptRRN(normalizeRRN(input.rrn));

  await prisma.$transaction(async (tx) => {
    const record = await tx.dailyWorker.create({
      data: {
        ...toDailyWorkerData(input),
        rrnEncrypted: encrypted,
        rrnIv: iv,
        company: { connect: { id: companyId } },
        createdBy: { connect: { id: session.user.userId } },
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: session.user.userId,
        companyId,
        action: "CREATE",
        tableName: "daily_workers",
        recordId: record.id,
        payload: toDailyWorkerAuditPayload(input),
      },
    });
  });

  revalidateDailyWorkerPaths(companyId, session.user.role);
  return { success: true };
}

export async function updateDailyWorker(
  id: string,
  formData: FormData,
): Promise<DailyWorkerActionResult> {
  const session = await requireDataEditAuth();
  const companyId = resolveCompanyId(
    session,
    parseOptionalCompanyId(formData),
  );
  const { id: parsedId } = idSchema.parse({ id });
  const existing = await getOwnedDailyWorker(parsedId, companyId);
  const parsed = parseUpdateDailyWorkerFormData(formData);

  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }

  const input = parsed.data;

  let rrnEncrypted = existing.rrnEncrypted;
  let rrnIv = existing.rrnIv;

  if (input.rrn) {
    const encrypted = encryptRRN(normalizeRRN(input.rrn));
    rrnEncrypted = encrypted.encrypted;
    rrnIv = encrypted.iv;
  }

  const data = {
    ...toDailyWorkerData(input),
    rrnEncrypted,
    rrnIv,
  };

  await prisma.$transaction(async (tx) => {
    await tx.dailyWorker.update({
      where: { id: parsedId },
      data,
    });

    await tx.auditLog.create({
      data: {
        actorId: session.user.userId,
        companyId,
        action: "UPDATE",
        tableName: "daily_workers",
        recordId: parsedId,
        payload: toDailyWorkerAuditPayload(input),
      },
    });
  });

  revalidateDailyWorkerPaths(companyId, session.user.role);
  return { success: true };
}

export async function deleteDailyWorker(
  id: string,
  explicitCompanyId?: string | null,
) {
  const session = await requireDataEditAuth();
  const companyId = resolveCompanyId(session, explicitCompanyId);
  const { id: parsedId } = idSchema.parse({ id });
  const existing = await getOwnedDailyWorker(parsedId, companyId);

  await prisma.$transaction(async (tx) => {
    await tx.dailyWorker.update({
      where: { id: parsedId },
      data: { deletedAt: new Date() },
    });

    await tx.auditLog.create({
      data: {
        actorId: session.user.userId,
        companyId,
        action: "DELETE",
        tableName: "daily_workers",
        recordId: parsedId,
        payload: {
          name: existing.name,
          year: existing.year,
          month: existing.month,
        },
      },
    });
  });

  revalidateDailyWorkerPaths(companyId, session.user.role);
}

export async function revealDailyWorkerRRN(
  id: string,
  explicitCompanyId?: string | null,
) {
  const session = await requireDataEditAuth();
  const companyId = resolveCompanyId(session, explicitCompanyId);
  const { id: parsedId } = idSchema.parse({ id });
  const record = await getOwnedDailyWorker(parsedId, companyId);

  return {
    rrn: decryptRRN(record.rrnEncrypted, record.rrnIv),
  };
}

export async function deleteDailyWorkerAction(formData: FormData) {
  const id = formData.get("id");
  await deleteDailyWorker(
    String(id ?? ""),
    parseOptionalCompanyId(formData),
  );
}
