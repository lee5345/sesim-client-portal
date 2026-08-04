import type { RecentActivityTableRow } from "@/components/dashboard/recent-activity-table";
import { prisma } from "@/lib/db/db";
import { formatDate, formatYearMonth } from "@/lib/format/date";

function displayName(value: string | null | undefined) {
  return value?.trim() ? value : "—";
}

export async function getClientDashboardData(companyId: string) {
  const [
    company,
    newHireCount,
    terminationCount,
    dailyWorkerCount,
    compensationChangeCount,
    compensationInfoCount,
    businessIncomeCount,
    latestDailyWorkerPeriod,
    latestCompensationInfoPeriod,
    latestBusinessIncomePeriod,
    recentNewHires,
    recentTerminations,
    recentDailyWorkers,
    recentCompensationChanges,
    recentCompensationInfos,
    recentBusinessIncomes,
    recentLeaveRecords,
    recentDependentRecords,
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
    prisma.compensationChange.count({
      where: { companyId, deletedAt: null },
    }),
    prisma.compensationInfo.count({
      where: { companyId, deletedAt: null },
    }),
    prisma.businessIncome.count({
      where: { companyId, deletedAt: null },
    }),
    prisma.dailyWorker.findFirst({
      where: { companyId, deletedAt: null },
      orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
      select: { year: true, month: true },
    }),
    prisma.compensationInfo.findFirst({
      where: { companyId, deletedAt: null },
      orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
      select: { year: true, month: true },
    }),
    prisma.businessIncome.findFirst({
      where: { companyId, deletedAt: null },
      orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
      select: { year: true, month: true },
    }),
    prisma.newHire.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        hireDate: true,
        createdAt: true,
        createdBy: { select: { name: true } },
      },
    }),
    prisma.termination.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        terminationDate: true,
        createdAt: true,
        createdBy: { select: { name: true } },
      },
    }),
    prisma.dailyWorker.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        year: true,
        month: true,
        createdAt: true,
        createdBy: { select: { name: true } },
      },
    }),
    prisma.compensationChange.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        changeDate: true,
        createdAt: true,
        createdBy: { select: { name: true } },
      },
    }),
    prisma.compensationInfo.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        year: true,
        month: true,
        createdAt: true,
        createdBy: { select: { name: true } },
      },
    }),
    prisma.businessIncome.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        year: true,
        month: true,
        createdAt: true,
        createdBy: { select: { name: true } },
      },
    }),
    prisma.leaveRecord.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        periodStart: true,
        createdAt: true,
        createdBy: { select: { name: true } },
      },
    }),
    prisma.dependentRecord.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        dependentName: true,
        registrationRequestedDate: true,
        createdAt: true,
        createdBy: { select: { name: true } },
      },
    }),
  ]);

  const recentSubmissions: RecentActivityTableRow[] = [
    ...recentNewHires.map((r) => ({
      id: `new-hire-${r.id}`,
      name: r.name,
      type: "입사자" as const,
      relevantDate: formatDate(r.hireDate),
      createdByName: displayName(r.createdBy.name),
      createdAt: r.createdAt,
    })),
    ...recentTerminations.map((r) => ({
      id: `termination-${r.id}`,
      name: r.name,
      type: "퇴사자" as const,
      relevantDate: formatDate(r.terminationDate),
      createdByName: displayName(r.createdBy.name),
      createdAt: r.createdAt,
    })),
    ...recentDailyWorkers.map((r) => ({
      id: `daily-worker-${r.id}`,
      name: r.name,
      type: "일용직" as const,
      relevantDate: formatYearMonth(r.year, r.month),
      createdByName: displayName(r.createdBy.name),
      createdAt: r.createdAt,
    })),
    ...recentCompensationChanges.map((r) => ({
      id: `compensation-change-${r.id}`,
      name: r.name,
      type: "급여변경" as const,
      relevantDate: formatDate(r.changeDate),
      createdByName: displayName(r.createdBy.name),
      createdAt: r.createdAt,
    })),
    ...recentCompensationInfos.map((r) => ({
      id: `compensation-info-${r.id}`,
      name: r.name,
      type: "상세급여" as const,
      relevantDate: formatYearMonth(r.year, r.month),
      createdByName: displayName(r.createdBy.name),
      createdAt: r.createdAt,
    })),
    ...recentBusinessIncomes.map((r) => ({
      id: `business-income-${r.id}`,
      name: r.name,
      type: "사업소득" as const,
      relevantDate: formatYearMonth(r.year, r.month),
      createdByName: displayName(r.createdBy.name),
      createdAt: r.createdAt,
    })),
    ...recentLeaveRecords.map((r) => ({
      id: `leave-record-${r.id}`,
      name: r.name,
      type: "휴직자 등" as const,
      relevantDate: formatDate(r.periodStart),
      createdByName: displayName(r.createdBy.name),
      createdAt: r.createdAt,
    })),
    ...recentDependentRecords.map((r) => ({
      id: `dependent-record-${r.id}`,
      name: r.dependentName,
      type: "피부양자" as const,
      relevantDate: formatDate(r.registrationRequestedDate),
      createdByName: displayName(r.createdBy.name),
      createdAt: r.createdAt,
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10);

  return {
    companyName: company?.name ?? "회사",
    newHireCount,
    terminationCount,
    dailyWorkerCount,
    compensationChangeCount,
    compensationInfoCount,
    businessIncomeCount,
    latestDailyWorkerPeriod,
    latestCompensationInfoPeriod,
    latestBusinessIncomePeriod,
    recentSubmissions,
  };
}
