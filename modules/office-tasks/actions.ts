"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db/db";
import { requireAuth } from "@/lib/auth/guards";
import {
  formatDueDateInput,
  formatDueTimeInput,
  isOverdueInKst,
} from "@/lib/datetime/kst";
import type {
  OfficeTaskCompanyOption,
  OfficeTaskStaffOption,
  OfficeTaskTableRow,
} from "@/lib/office-tasks/types";
import { hasValidDeleteConfirmation } from "@/lib/validation/delete-confirmation";
import {
  parseCreateOfficeTaskFormData,
  parseOfficeTaskIdFormData,
  parseUpdateOfficeTaskFormData,
} from "@/lib/validation/office-task";
import { sortFirmStaffUsers } from "@/lib/sort/korean";
import { afterFirmScopeMutation } from "@/modules/realtime/post-mutation";

export type OfficeTaskActionResult =
  | { success: true }
  | { success: false; error: string };

const TASK_MANAGER_PATH = "/firm/task-manager";
const COMPLETED_PATH = "/firm/task-manager/completed";

const taskInclude = {
  company: {
    select: {
      id: true,
      name: true,
      isActive: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      name: true,
    },
  },
  completedBy: {
    select: {
      id: true,
      name: true,
    },
  },
  assignees: {
    select: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} as const;

type FirmSession = Awaited<ReturnType<typeof requireAuth>>;

function revalidateOfficeTaskPaths() {
  revalidatePath(TASK_MANAGER_PATH);
  revalidatePath(COMPLETED_PATH);
  revalidatePath("/firm/dashboard");
}

function accessWhere(userId: string) {
  return {
    deletedAt: null,
    OR: [
      { createdById: userId },
      { assignees: { some: { userId } } },
    ],
  };
}

function toTableRow(task: {
  id: string;
  title: string;
  description: string | null;
  dueAt: Date;
  hasDueTime: boolean;
  completedAt: Date | null;
  createdAt: Date;
  company: {
    id: string;
    name: string;
    isActive: boolean;
  } | null;
  createdBy: { id: string; name: string };
  completedBy: { id: string; name: string } | null;
  assignees: { user: { id: string; name: string } }[];
}): OfficeTaskTableRow {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    dueDate: formatDueDateInput(task.dueAt, task.hasDueTime),
    dueTime: task.hasDueTime ? formatDueTimeInput(task.dueAt) : null,
    hasDueTime: task.hasDueTime,
    dueAtIso: task.dueAt.toISOString(),
    company: task.company,
    createdBy: task.createdBy,
    completedBy: task.completedBy,
    completedAtIso: task.completedAt?.toISOString() ?? null,
    assignees: task.assignees.map((assignee) => assignee.user),
    isOverdue: isOverdueInKst(task.dueAt, task.hasDueTime),
    createdAt: task.createdAt.toISOString(),
  };
}

async function getAccessibleTask(taskId: string, userId: string) {
  return prisma.officeTask.findFirst({
    where: {
      id: taskId,
      deletedAt: null,
      OR: [
        { createdById: userId },
        { assignees: { some: { userId } } },
      ],
    },
    include: {
      assignees: {
        select: { userId: true },
      },
    },
  });
}

async function validateAssigneeIds(input: {
  session: FirmSession;
  assigneeIds: string[];
  existingAssigneeIds?: string[];
}) {
  const { session, assigneeIds, existingAssigneeIds = [] } = input;
  const userId = session.user.userId;
  const isAdmin = session.user.role === "FIRM_ADMIN";

  if (!isAdmin) {
    if (assigneeIds.length !== 1 || assigneeIds[0] !== userId) {
      return {
        success: false as const,
        error: "담당자는 본인만 지정할 수 있습니다.",
      };
    }
    return { success: true as const, assigneeIds: [userId] };
  }

  const uniqueIds = [...new Set(assigneeIds)];
  const existingSet = new Set(existingAssigneeIds);
  const newlyAddedIds = uniqueIds.filter((id) => !existingSet.has(id));

  const firmUsers = await prisma.user.findMany({
    where: {
      role: { in: ["FIRM_STAFF", "FIRM_ADMIN"] },
      OR: [
        { id: { in: uniqueIds } },
      ],
    },
    select: {
      id: true,
      isActive: true,
    },
  });

  const userMap = new Map(firmUsers.map((user) => [user.id, user]));

  for (const assigneeId of uniqueIds) {
    const user = userMap.get(assigneeId);
    if (!user) {
      return {
        success: false as const,
        error: "담당자 정보가 올바르지 않습니다.",
      };
    }

    if (!user.isActive && !existingSet.has(assigneeId)) {
      return {
        success: false as const,
        error: "비활성 직원은 새 담당자로 지정할 수 없습니다.",
      };
    }
  }

  for (const newId of newlyAddedIds) {
    const user = userMap.get(newId);
    if (!user?.isActive) {
      return {
        success: false as const,
        error: "비활성 직원은 새 담당자로 지정할 수 없습니다.",
      };
    }
  }

  return { success: true as const, assigneeIds: uniqueIds };
}

async function validateCompanyId(companyId: string | null) {
  if (!companyId) {
    return { success: true as const, companyId: null };
  }

  const company = await prisma.company.findFirst({
    where: {
      id: companyId,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!company) {
    return {
      success: false as const,
      error: "고객사 정보가 올바르지 않습니다.",
    };
  }

  return { success: true as const, companyId };
}

export async function listOfficeTaskStaffOptions(): Promise<OfficeTaskStaffOption[]> {
  await requireAuth(["FIRM_STAFF", "FIRM_ADMIN"]);

  const users = await prisma.user.findMany({
    where: { role: { in: ["FIRM_STAFF", "FIRM_ADMIN"] } },
    select: {
      id: true,
      name: true,
      role: true,
      isActive: true,
    },
  });

  return sortFirmStaffUsers(users).map((user) => ({
    id: user.id,
    name: user.name,
    role: user.role as "FIRM_STAFF" | "FIRM_ADMIN",
    isActive: user.isActive,
  }));
}

export async function listOfficeTaskCompanyOptions(): Promise<OfficeTaskCompanyOption[]> {
  await requireAuth(["FIRM_STAFF", "FIRM_ADMIN"]);

  const companies = await prisma.company.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      name: true,
      isActive: true,
    },
    orderBy: { name: "asc" },
  });

  return companies;
}

export async function listActiveOfficeTasks(): Promise<OfficeTaskTableRow[]> {
  const session = await requireAuth(["FIRM_STAFF", "FIRM_ADMIN"]);
  const userId = session.user.userId;

  const tasks = await prisma.officeTask.findMany({
    where: {
      ...accessWhere(userId),
      completedAt: null,
    },
    include: taskInclude,
    orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
  });

  return tasks.map(toTableRow);
}

export async function listCompletedOfficeTasks(): Promise<OfficeTaskTableRow[]> {
  const session = await requireAuth(["FIRM_STAFF", "FIRM_ADMIN"]);
  const userId = session.user.userId;

  const tasks = await prisma.officeTask.findMany({
    where: {
      ...accessWhere(userId),
      completedAt: { not: null },
    },
    include: taskInclude,
    orderBy: [{ completedAt: "desc" }, { dueAt: "desc" }],
  });

  return tasks.map(toTableRow);
}

export async function createOfficeTask(
  formData: FormData,
): Promise<OfficeTaskActionResult> {
  const session = await requireAuth(["FIRM_STAFF", "FIRM_ADMIN"]);
  const parsed = parseCreateOfficeTaskFormData(formData);

  if (!parsed.success) {
    return parsed;
  }

  const assigneeResult = await validateAssigneeIds({
    session,
    assigneeIds:
      parsed.data.assigneeIds.length > 0
        ? parsed.data.assigneeIds
        : [session.user.userId],
  });
  if (!assigneeResult.success) {
    return assigneeResult;
  }

  const companyResult = await validateCompanyId(parsed.data.companyId);
  if (!companyResult.success) {
    return companyResult;
  }

  try {
    await prisma.officeTask.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        dueAt: parsed.data.dueAt,
        hasDueTime: parsed.data.hasDueTime,
        companyId: companyResult.companyId,
        createdById: session.user.userId,
        assignees: {
          create: assigneeResult.assigneeIds.map((userId) => ({ userId })),
        },
      },
    });
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "업무를 등록할 수 없습니다.",
    };
  }

  revalidateOfficeTaskPaths();
  await afterFirmScopeMutation();
  return { success: true };
}

export async function updateOfficeTask(
  formData: FormData,
): Promise<OfficeTaskActionResult> {
  const session = await requireAuth(["FIRM_STAFF", "FIRM_ADMIN"]);
  const parsed = parseUpdateOfficeTaskFormData(formData);

  if (!parsed.success) {
    return parsed;
  }

  const existing = await getAccessibleTask(parsed.data.id, session.user.userId);
  if (!existing) {
    return { success: false, error: "업무를 찾을 수 없습니다." };
  }

  const existingAssigneeIds = existing.assignees.map(
    (assignee: { userId: string }) => assignee.userId,
  );

  const assigneeResult = await validateAssigneeIds({
    session,
    assigneeIds:
      parsed.data.assigneeIds.length > 0
        ? parsed.data.assigneeIds
        : existingAssigneeIds.length > 0
          ? existingAssigneeIds
          : [session.user.userId],
    existingAssigneeIds,
  });
  if (!assigneeResult.success) {
    return assigneeResult;
  }

  const companyResult = await validateCompanyId(parsed.data.companyId);
  if (!companyResult.success) {
    return companyResult;
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.officeTask.update({
        where: { id: parsed.data.id },
        data: {
          title: parsed.data.title,
          description: parsed.data.description,
          dueAt: parsed.data.dueAt,
          hasDueTime: parsed.data.hasDueTime,
          companyId: companyResult.companyId,
        },
      });

      await tx.officeTaskAssignee.deleteMany({
        where: { taskId: parsed.data.id },
      });

      if (assigneeResult.assigneeIds.length > 0) {
        await tx.officeTaskAssignee.createMany({
          data: assigneeResult.assigneeIds.map((userId) => ({
            taskId: parsed.data.id,
            userId,
          })),
        });
      }
    });
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "업무를 수정할 수 없습니다.",
    };
  }

  revalidateOfficeTaskPaths();
  await afterFirmScopeMutation();
  return { success: true };
}

export async function completeOfficeTaskAction(
  formData: FormData,
): Promise<OfficeTaskActionResult> {
  const session = await requireAuth(["FIRM_STAFF", "FIRM_ADMIN"]);
  const parsed = parseOfficeTaskIdFormData(formData);

  if (!parsed.success) {
    return parsed;
  }

  const existing = await getAccessibleTask(parsed.data.id, session.user.userId);
  if (!existing) {
    return { success: false, error: "업무를 찾을 수 없습니다." };
  }

  if (existing.completedAt) {
    return { success: false, error: "이미 완료된 업무입니다." };
  }

  await prisma.officeTask.update({
    where: { id: parsed.data.id },
    data: {
      completedAt: new Date(),
      completedById: session.user.userId,
    },
  });

  revalidateOfficeTaskPaths();
  await afterFirmScopeMutation();
  return { success: true };
}

export async function reopenOfficeTaskAction(
  formData: FormData,
): Promise<OfficeTaskActionResult> {
  const session = await requireAuth(["FIRM_STAFF", "FIRM_ADMIN"]);
  const parsed = parseOfficeTaskIdFormData(formData);

  if (!parsed.success) {
    return parsed;
  }

  const existing = await getAccessibleTask(parsed.data.id, session.user.userId);
  if (!existing) {
    return { success: false, error: "업무를 찾을 수 없습니다." };
  }

  if (!existing.completedAt) {
    return { success: false, error: "완료되지 않은 업무입니다." };
  }

  await prisma.officeTask.update({
    where: { id: parsed.data.id },
    data: {
      completedAt: null,
      completedById: null,
    },
  });

  revalidateOfficeTaskPaths();
  await afterFirmScopeMutation();
  return { success: true };
}

export async function deleteOfficeTaskAction(
  formData: FormData,
): Promise<OfficeTaskActionResult> {
  const session = await requireAuth(["FIRM_STAFF", "FIRM_ADMIN"]);

  if (!hasValidDeleteConfirmation(formData)) {
    return { success: false, error: "삭제 확인 문구가 일치하지 않습니다." };
  }

  const parsed = parseOfficeTaskIdFormData(formData);
  if (!parsed.success) {
    return parsed;
  }

  const existing = await getAccessibleTask(parsed.data.id, session.user.userId);
  if (!existing) {
    return { success: false, error: "업무를 찾을 수 없습니다." };
  }

  await prisma.officeTask.update({
    where: { id: parsed.data.id },
    data: { deletedAt: new Date() },
  });

  revalidateOfficeTaskPaths();
  await afterFirmScopeMutation();
  return { success: true };
}

export async function completeOfficeTask(formData: FormData) {
  await completeOfficeTaskAction(formData);
}

export async function reopenOfficeTask(formData: FormData) {
  await reopenOfficeTaskAction(formData);
}

export async function deleteOfficeTask(formData: FormData) {
  await deleteOfficeTaskAction(formData);
}
