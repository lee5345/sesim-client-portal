import { prisma } from "@/lib/db/db";

export async function getClientDashboardData(companyId: string) {
  const [
    company,
    newHireCount,
    terminationCount,
    dailyWorkerCount,
    recentNewHires,
    recentTerminations,
    recentDailyWorkers,
  ] = await Promise.all([
    prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true },
    }),
    prisma.newHire.count({
      where: { companyId, deletedAt: null },
    }),
    prisma.termination.count({
      where: { companyId, deletedAt: null },
    }),
    prisma.dailyWorker.count({
      where: { companyId, deletedAt: null },
    }),
    prisma.newHire.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { name: true, createdAt: true },
    }),
    prisma.termination.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { name: true, createdAt: true },
    }),
    prisma.dailyWorker.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { name: true, createdAt: true },
    }),
  ]);

  const recentSubmissions = [
    ...recentNewHires.map((r) => ({
      name: r.name,
      type: "입사자" as const,
      date: r.createdAt,
    })),
    ...recentTerminations.map((r) => ({
      name: r.name,
      type: "퇴사자" as const,
      date: r.createdAt,
    })),
    ...recentDailyWorkers.map((r) => ({
      name: r.name,
      type: "일용직" as const,
      date: r.createdAt,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 10);

  return {
    companyName: company?.name ?? "회사",
    newHireCount,
    terminationCount,
    dailyWorkerCount,
    recentSubmissions,
  };
}
