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
import { parseAuditPayloadRows } from "@/lib/format/audit-payload";

type ActivityLogPayloadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payload: Prisma.JsonValue | null;
};

export function ActivityLogPayloadDialog({
  open,
  onOpenChange,
  payload,
}: ActivityLogPayloadDialogProps) {
  const rows = parseAuditPayloadRows(payload);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>페이로드 상세</DialogTitle>
          <DialogDescription>
            해당 활동에 기록된 페이로드입니다.
          </DialogDescription>
        </DialogHeader>

        {rows.length === 0 ? (
          <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            기록된 페이로드가 없습니다.
          </div>
        ) : (
          <div className="max-h-[min(28rem,60vh)] overflow-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 border-b bg-muted">
                <tr className="text-left">
                  <th className="w-[40%] px-4 py-2.5 font-medium whitespace-nowrap">
                    항목
                  </th>
                  <th className="px-4 py-2.5 font-medium">내용</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.key}
                    className="border-b border-border/60 last:border-0"
                  >
                    <td className="px-4 py-2.5 align-top whitespace-nowrap text-muted-foreground">
                      {row.label}
                    </td>
                    <td className="px-4 py-2.5 align-top break-words whitespace-pre-wrap">
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
