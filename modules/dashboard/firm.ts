import type { RecentActivityTableRow } from "@/components/dashboard/recent-activity-table";
import { prisma } from "@/lib/db/db";
import { formatDate, formatYearMonth } from "@/lib/format/date";
import { listActiveOfficeTasks } from "@/modules/office-tasks/actions";

function displayName(value: string | null | undefined) {
  return value?.trim() ? value : "—";
}

export async function getFirmDashboardData() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    companyCount,
    clientAccountCount,
    activeOfficeTasks,
    recentNewHires,
    recentTerminations,
    recentDailyWorkers,
    recentCompensationChanges,
    recentCompensationInfos,
    recentBusinessIncomes,
    recentLeaveRecords,
    recentDependentRecords,
    recentNewHireCount,
    recentTerminationCount,
    recentDailyWorkerCount,
    recentCompensationChangeCount,
    recentCompensationInfoCount,
    recentBusinessIncomeCount,
    recentLeaveRecordCount,
    recentDependentRecordCount,
  ] = await Promise.all([
    prisma.company.count({ where: { deletedAt: null } }),
    prisma.user.count({
      where: { role: "CLIENT_ADMIN" },
    }),
    listActiveOfficeTasks(),
    prisma.newHire.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        hireDate: true,
        createdAt: true,
        createdBy: { select: { name: true } },
        company: { select: { id: true, name: true } },
      },
    }),
    prisma.termination.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        terminationDate: true,
        createdAt: true,
        createdBy: { select: { name: true } },
        company: { select: { id: true, name: true } },
      },
    }),
    prisma.dailyWorker.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        year: true,
        month: true,
        createdAt: true,
        createdBy: { select: { name: true } },
        company: { select: { id: true, name: true } },
      },
    }),
    prisma.compensationChange.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        changeDate: true,
        createdAt: true,
        createdBy: { select: { name: true } },
        company: { select: { id: true, name: true } },
      },
    }),
    prisma.compensationInfo.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        year: true,
        month: true,
        createdAt: true,
        createdBy: { select: { name: true } },
        company: { select: { id: true, name: true } },
      },
    }),
    prisma.businessIncome.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        year: true,
        month: true,
        createdAt: true,
        createdBy: { select: { name: true } },
        company: { select: { id: true, name: true } },
      },
    }),
    prisma.leaveRecord.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        periodStart: true,
        createdAt: true,
        createdBy: { select: { name: true } },
        company: { select: { id: true, name: true } },
      },
    }),
    prisma.dependentRecord.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        dependentName: true,
        registrationRequestedDate: true,
        createdAt: true,
        createdBy: { select: { name: true } },
        company: { select: { id: true, name: true } },
      },
    }),
    prisma.newHire.count({
      where: { deletedAt: null, createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.termination.count({
      where: { deletedAt: null, createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.dailyWorker.count({
      where: { deletedAt: null, createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.compensationChange.count({
      where: { deletedAt: null, createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.compensationInfo.count({
      where: { deletedAt: null, createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.businessIncome.count({
      where: { deletedAt: null, createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.leaveRecord.count({
      where: { deletedAt: null, createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.dependentRecord.count({
      where: { deletedAt: null, createdAt: { gte: sevenDaysAgo } },
    }),
  ]);

  const recentActivityCount =
    recentNewHireCount +
    recentTerminationCount +
    recentDailyWorkerCount +
    recentCompensationChangeCount +
    recentCompensationInfoCount +
    recentBusinessIncomeCount +
    recentLeaveRecordCount +
    recentDependentRecordCount;

  const recentActivity: RecentActivityTableRow[] = [
    ...recentNewHires.map((r) => ({
      id: `new-hire-${r.id}`,
      name: r.name,
      companyId: r.company.id,
      companyName: r.company.name,
      type: "입사자" as const,
      relevantDate: formatDate(r.hireDate),
      createdByName: displayName(r.createdBy.name),
      createdAt: r.createdAt,
    })),
    ...recentTerminations.map((r) => ({
      id: `termination-${r.id}`,
      name: r.name,
      companyId: r.company.id,
      companyName: r.company.name,
      type: "퇴사자" as const,
      relevantDate: formatDate(r.terminationDate),
      createdByName: displayName(r.createdBy.name),
      createdAt: r.createdAt,
    })),
    ...recentDailyWorkers.map((r) => ({
      id: `daily-worker-${r.id}`,
      name: r.name,
      companyId: r.company.id,
      companyName: r.company.name,
      type: "일용직" as const,
      relevantDate: formatYearMonth(r.year, r.month),
      year: r.year,
      month: r.month,
      createdByName: displayName(r.createdBy.name),
      createdAt: r.createdAt,
    })),
    ...recentCompensationChanges.map((r) => ({
      id: `compensation-change-${r.id}`,
      name: r.name,
      companyId: r.company.id,
      companyName: r.company.name,
      type: "급여변경" as const,
      relevantDate: formatDate(r.changeDate),
      createdByName: displayName(r.createdBy.name),
      createdAt: r.createdAt,
    })),
    ...recentCompensationInfos.map((r) => ({
      id: `compensation-info-${r.id}`,
      name: r.name,
      companyId: r.company.id,
      companyName: r.company.name,
      type: "상세급여" as const,
      relevantDate: formatYearMonth(r.year, r.month),
      year: r.year,
      month: r.month,
      createdByName: displayName(r.createdBy.name),
      createdAt: r.createdAt,
    })),
    ...recentBusinessIncomes.map((r) => ({
      id: `business-income-${r.id}`,
      name: r.name,
      companyId: r.company.id,
      companyName: r.company.name,
      type: "사업소득" as const,
      relevantDate: formatYearMonth(r.year, r.month),
      year: r.year,
      month: r.month,
      createdByName: displayName(r.createdBy.name),
      createdAt: r.createdAt,
    })),
    ...recentLeaveRecords.map((r) => ({
      id: `leave-record-${r.id}`,
      name: r.name,
      companyId: r.company.id,
      companyName: r.company.name,
      type: "휴직자 등" as const,
      relevantDate: formatDate(r.periodStart),
      createdByName: displayName(r.createdBy.name),
      createdAt: r.createdAt,
    })),
    ...recentDependentRecords.map((r) => ({
      id: `dependent-record-${r.id}`,
      name: r.dependentName,
      companyId: r.company.id,
      companyName: r.company.name,
      type: "피부양자" as const,
      relevantDate: formatDate(r.registrationRequestedDate),
      createdByName: displayName(r.createdBy.name),
      createdAt: r.createdAt,
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10);

  return {
    companyCount,
    clientAccountCount,
    recentActivityCount,
    recentActivity,
    activeOfficeTasks,
  };
}
