import { prisma } from "@/lib/db/db";

export async function getFirmDashboardData() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    companyCount,
    pendingRequestCount,
    recentNewHires,
    recentTerminations,
    recentNewHireCount,
    recentTerminationCount,
  ] = await Promise.all([
    prisma.company.count({ where: { deletedAt: null } }),
    prisma.registrationRequest.count({
      where: { status: "PENDING" },
    }),
    prisma.newHire.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        name: true,
        createdAt: true,
        company: { select: { name: true } },
      },
    }),
    prisma.termination.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        name: true,
        createdAt: true,
        company: { select: { name: true } },
      },
    }),
    prisma.newHire.count({
      where: { deletedAt: null, createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.termination.count({
      where: { deletedAt: null, createdAt: { gte: sevenDaysAgo } },
    }),
  ]);

  const recentActivityCount = recentNewHireCount + recentTerminationCount;

  const recentActivity = [
    ...recentNewHires.map((r) => ({
      name: r.name,
      companyName: r.company.name,
      type: "입사자" as const,
      date: r.createdAt,
    })),
    ...recentTerminations.map((r) => ({
      name: r.name,
      companyName: r.company.name,
      type: "퇴사자" as const,
      date: r.createdAt,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 10);

  return {
    companyCount,
    pendingRequestCount,
    recentActivityCount,
    recentActivity,
  };
}
