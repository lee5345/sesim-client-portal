"use client";

import { useTransition } from "react";
import { Download, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getAttachmentDownloadUrl } from "@/modules/attachments/actions";
import type { AttachmentSummary } from "@/modules/attachments/actions";

type FileAttachmentListProps = {
  attachments: AttachmentSummary[];
  companyId?: string;
  disabled?: boolean;
};

export function FileAttachmentList({
  attachments,
  companyId,
  disabled = false,
}: FileAttachmentListProps) {
  const [isPending, startTransition] = useTransition();

  if (attachments.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  function handleDownload(attachmentId: string) {
    startTransition(async () => {
      const result = await getAttachmentDownloadUrl(attachmentId, companyId);
      if (!result.success) {
        window.alert(result.error);
        return;
      }

      const link = document.createElement("a");
      link.href = result.url;
      link.download = result.filename;
      link.rel = "noopener noreferrer";
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  }

  return (
    <ul className="space-y-1">
      {attachments.map((attachment) => (
        <li key={attachment.id}>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto px-0 py-0 text-left"
            disabled={disabled || isPending}
            onClick={() => handleDownload(attachment.id)}
          >
            <FileText className="size-3.5" />
            <span className="max-w-[12rem] truncate">{attachment.filename}</span>
            <Download className="size-3.5" />
          </Button>
        </li>
      ))}
    </ul>
  );
}
