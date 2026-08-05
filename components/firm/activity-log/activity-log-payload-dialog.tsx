"use client";

import type { Prisma } from "@/lib/generated/prisma/client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ActivityLogPayloadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payload: Prisma.JsonValue | null;
};

function formatPayloadJson(payload: Prisma.JsonValue | null): string {
  if (payload === null || payload === undefined) {
    return "null";
  }

  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
}

export function ActivityLogPayloadDialog({
  open,
  onOpenChange,
  payload,
}: ActivityLogPayloadDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl"
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle>변경 내용 상세</DialogTitle>
          <DialogDescription>
            해당 활동에 기록된 변경 내용입니다.
          </DialogDescription>
        </DialogHeader>

        <pre className="max-h-[min(28rem,60vh)] overflow-auto rounded-lg border bg-muted/40 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all">
          {formatPayloadJson(payload)}
        </pre>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
