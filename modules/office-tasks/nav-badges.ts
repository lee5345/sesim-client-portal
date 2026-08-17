import { prisma } from "@/lib/db/db";
import { isOverdueInKst } from "@/lib/datetime/kst";
import { summarizeOfficeTaskNavBadges } from "@/lib/office-tasks/agenda";

export async function getOfficeTaskNavBadgeCounts(userId: string) {
  const tasks = await prisma.officeTask.findMany({
    where: {
      deletedAt: null,
      completedAt: null,
      OR: [
        { createdById: userId },
        { assignees: { some: { userId } } },
      ],
    },
    select: {
      dueAt: true,
      hasDueTime: true,
      createdAt: true,
    },
  });

  return summarizeOfficeTaskNavBadges(
    tasks.map((task) => ({
      dueAtIso: task.dueAt.toISOString(),
      createdAt: task.createdAt.toISOString(),
      isOverdue: isOverdueInKst(task.dueAt, task.hasDueTime),
    })),
  );
}
