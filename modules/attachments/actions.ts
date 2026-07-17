"use server";

import { z } from "zod";

import { prisma } from "@/lib/db/db";
import {
  MAX_ATTACHMENTS_PER_RECORD,
} from "@/lib/storage/attachment-constraints";
import {
  buildAttachmentBlobPath,
  createPrivateAttachmentDownloadUrl,
  deleteAttachmentBlob,
  parseAttachmentFilesFromFormData,
  parseAttachmentIdsToRemove,
  putPrivateAttachmentBlob,
} from "@/lib/storage/vercel-blob";
import type { FileAttachmentEntityType } from "@/lib/generated/prisma/client";
import {
  requireDataEditAuth,
  resolveCompanyId,
} from "@/lib/permissions/crud";

const attachmentIdSchema = z.object({
  id: z.string().uuid(),
});

export type AttachmentSummary = {
  id: string;
  filename: string;
};

export type AttachmentDownloadResult =
  | { success: true; url: string; filename: string }
  | { success: false; error: string };

async function getOwnedAttachment(id: string, companyId: string) {
  const attachment = await prisma.fileAttachment.findFirst({
    where: { id, companyId, deletedAt: null },
    select: {
      id: true,
      blobPath: true,
      filename: true,
      entityType: true,
      entityId: true,
    },
  });

  if (!attachment) {
    throw new Error("첨부 파일을 찾을 수 없습니다.");
  }

  return attachment;
}

export async function listAttachmentSummaries(
  companyId: string,
  entityType: FileAttachmentEntityType,
  entityId: string,
): Promise<AttachmentSummary[]> {
  const attachments = await prisma.fileAttachment.findMany({
    where: {
      companyId,
      entityType,
      entityId,
      deletedAt: null,
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      filename: true,
    },
  });

  return attachments;
}

export async function listAttachmentSummariesByEntityIds(
  companyId: string,
  entityType: FileAttachmentEntityType,
  entityIds: string[],
): Promise<Record<string, AttachmentSummary[]>> {
  if (entityIds.length === 0) {
    return {};
  }

  const attachments = await prisma.fileAttachment.findMany({
    where: {
      companyId,
      entityType,
      entityId: { in: entityIds },
      deletedAt: null,
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      entityId: true,
      filename: true,
    },
  });

  const byEntityId: Record<string, AttachmentSummary[]> = {};
  for (const attachment of attachments) {
    const current = byEntityId[attachment.entityId] ?? [];
    current.push({ id: attachment.id, filename: attachment.filename });
    byEntityId[attachment.entityId] = current;
  }

  return byEntityId;
}

export async function syncEntityAttachments(input: {
  companyId: string;
  entityType: FileAttachmentEntityType;
  entityId: string;
  actorId: string;
  formData: FormData;
}): Promise<void> {
  const idsToRemove = parseAttachmentIdsToRemove(input.formData);
  const newFiles = parseAttachmentFilesFromFormData(input.formData);

  if (idsToRemove.length > 0) {
    const attachmentsToRemove = await prisma.fileAttachment.findMany({
      where: {
        id: { in: idsToRemove },
        companyId: input.companyId,
        entityType: input.entityType,
        entityId: input.entityId,
        deletedAt: null,
      },
      select: { id: true, blobPath: true },
    });

    for (const attachment of attachmentsToRemove) {
      await deleteAttachmentBlob(attachment.blobPath);
    }

    if (attachmentsToRemove.length > 0) {
      await prisma.fileAttachment.updateMany({
        where: {
          id: { in: attachmentsToRemove.map((item) => item.id) },
        },
        data: { deletedAt: new Date() },
      });
    }
  }

  const remainingCount = await prisma.fileAttachment.count({
    where: {
      companyId: input.companyId,
      entityType: input.entityType,
      entityId: input.entityId,
      deletedAt: null,
    },
  });

  if (remainingCount + newFiles.length > MAX_ATTACHMENTS_PER_RECORD) {
    throw new Error(
      `첨부 파일은 최대 ${MAX_ATTACHMENTS_PER_RECORD}개까지 등록할 수 있습니다.`,
    );
  }

  for (const file of newFiles) {
    const blobPath = buildAttachmentBlobPath({
      companyId: input.companyId,
      entityType: input.entityType,
      entityId: input.entityId,
      filename: file.name,
    });
    const uploaded = await putPrivateAttachmentBlob(blobPath, file);

    await prisma.fileAttachment.create({
      data: {
        companyId: input.companyId,
        entityType: input.entityType,
        entityId: input.entityId,
        blobPath: uploaded.pathname,
        filename: file.name,
        mimeType: uploaded.mimeType,
        sizeBytes: uploaded.sizeBytes,
        createdById: input.actorId,
      },
    });
  }
}

export async function softDeleteEntityAttachments(input: {
  companyId: string;
  entityType: FileAttachmentEntityType;
  entityId: string;
}): Promise<void> {
  const attachments = await prisma.fileAttachment.findMany({
    where: {
      companyId: input.companyId,
      entityType: input.entityType,
      entityId: input.entityId,
      deletedAt: null,
    },
    select: { id: true, blobPath: true },
  });

  for (const attachment of attachments) {
    await deleteAttachmentBlob(attachment.blobPath);
  }

  if (attachments.length > 0) {
    await prisma.fileAttachment.updateMany({
      where: { id: { in: attachments.map((item) => item.id) } },
      data: { deletedAt: new Date() },
    });
  }
}

export async function getAttachmentDownloadUrl(
  attachmentId: string,
  explicitCompanyId?: string | null,
): Promise<AttachmentDownloadResult> {
  try {
    const session = await requireDataEditAuth();
    const companyId = resolveCompanyId(session, explicitCompanyId);
    const { id } = attachmentIdSchema.parse({ id: attachmentId });
    const attachment = await getOwnedAttachment(id, companyId);
    const url = await createPrivateAttachmentDownloadUrl(attachment.blobPath);

    return {
      success: true,
      url,
      filename: attachment.filename,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "첨부 파일을 다운로드할 수 없습니다.",
    };
  }
}
