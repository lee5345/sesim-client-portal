import { prisma } from "@/lib/db/db";

function maxDate(...dates: (Date | null | undefined)[]): Date | null {
  let max: Date | null = null;

  for (const date of dates) {
    if (!date) {
      continue;
    }

    if (!max || date > max) {
      max = date;
    }
  }

  return max;
}

function bumpMap(
  map: Map<string, Date>,
  companyId: string,
  candidate: Date | null | undefined,
) {
  if (!candidate) {
    return;
  }

  const existing = map.get(companyId);
  if (!existing || candidate > existing) {
    map.set(companyId, candidate);
  }
}

export async function getCompanyLastModifiedAtById(): Promise<Map<string, Date>> {
  const [
    departmentMax,
    userMax,
    newHireMax,
    terminationMax,
    compensationChangeMax,
    compensationInfoMax,
    dailyWorkerMax,
  ] = await Promise.all([
    prisma.department.groupBy({
      by: ["companyId"],
      _max: { updatedAt: true },
    }),
    prisma.user.groupBy({
      by: ["companyId"],
      where: { companyId: { not: null } },
      _max: { updatedAt: true, createdAt: true },
    }),
    prisma.newHire.groupBy({
      by: ["companyId"],
      _max: { updatedAt: true },
    }),
    prisma.termination.groupBy({
      by: ["companyId"],
      _max: { updatedAt: true },
    }),
    prisma.compensationChange.groupBy({
      by: ["companyId"],
      _max: { updatedAt: true },
    }),
    prisma.compensationInfo.groupBy({
      by: ["companyId"],
      _max: { updatedAt: true },
    }),
    prisma.dailyWorker.groupBy({
      by: ["companyId"],
      _max: { updatedAt: true },
    }),
  ]);

  const map = new Map<string, Date>();

  for (const row of departmentMax) {
    bumpMap(map, row.companyId, row._max.updatedAt);
  }

  for (const row of userMax) {
    if (!row.companyId) {
      continue;
    }

    bumpMap(
      map,
      row.companyId,
      maxDate(row._max.updatedAt, row._max.createdAt),
    );
  }

  for (const row of newHireMax) {
    bumpMap(map, row.companyId, row._max.updatedAt);
  }

  for (const row of terminationMax) {
    bumpMap(map, row.companyId, row._max.updatedAt);
  }

  for (const row of compensationChangeMax) {
    bumpMap(map, row.companyId, row._max.updatedAt);
  }

  for (const row of compensationInfoMax) {
    bumpMap(map, row.companyId, row._max.updatedAt);
  }

  for (const row of dailyWorkerMax) {
    bumpMap(map, row.companyId, row._max.updatedAt);
  }

  return map;
}

export function resolveCompanyLastModifiedAt(
  companyUpdatedAt: Date,
  relatedLastModifiedAt: Date | undefined,
): Date {
  return maxDate(companyUpdatedAt, relatedLastModifiedAt) ?? companyUpdatedAt;
}
