"use server";

import { prisma } from "@/lib/db/db";
import { requireDataEditAuth, resolveCompanyId } from "@/lib/permissions/crud";
import { listHireIntakes } from "@/modules/hire-intakes/actions";

export async function listCompanyNewHires(companyId: string) {
  return listHireIntakes(companyId);
}

export async function listCompanyTerminations(companyId: string) {
  const session = await requireDataEditAuth();
  resolveCompanyId(session, companyId);

  return prisma.termination.findMany({
    where: { companyId, deletedAt: null },
    orderBy: [{ terminationDate: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      terminationDate: true,
      reason: true,
      createdAt: true,
    },
  });
}
