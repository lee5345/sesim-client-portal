"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { ActivityLogPayloadDialog } from "@/components/firm/activity-log/activity-log-payload-dialog";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Button } from "@/components/ui/button";
import { getRoleLabel } from "@/lib/auth/roles";
import { summarizeAuditPayload } from "@/lib/filters/audit-logs";
import { formatDateTime } from "@/lib/format/date";
import type { AuditLogListItem, AuditLogListResult } from "@/modules/audit-logs/actions";
import {
  getAuditActionLabel,
  getAuditTableNameLabel,
} from "@/modules/audit-logs/labels";
import type { Prisma } from "@/lib/generated/prisma/client";

const headerCellClassName =
  "border-r border-border/30 px-3 py-3 text-left font-medium whitespace-nowrap last:border-r-0";
const bodyCellClassName =
  "border-r border-border/30 px-3 py-3 align-middle last:border-r-0";

type ActivityLogTableProps = {
  result: AuditLogListResult;
  onPageChange: (page: number) => void;
  loading?: boolean;
};

export function ActivityLogTable({
  result,
  onPageChange,
  loading = false,
}: ActivityLogTableProps) {
  const [payloadOpen, setPayloadOpen] = useState(false);
  const [selectedPayload, setSelectedPayload] =
    useState<Prisma.JsonValue | null>(null);

  function openPayload(payload: Prisma.JsonValue | null) {
    setSelectedPayload(payload);
    setPayloadOpen(true);
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border">
      <div className="min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-auto">
        <table className="w-full min-w-[52rem] table-fixed border-collapse text-sm">
          <colgroup>
            <col className="w-[7rem]" />
            <col className="w-[6.5rem]" />
            <col className="w-[3.5rem]" />
            <col className="w-[7.5rem]" />
            <col />
            <col className="w-[11.5rem]" />
          </colgroup>
          <thead className="sticky top-0 z-10 border-b border-border/60 bg-muted">
            <tr>
              <th className={headerCellClassName}>사용자</th>
              <th className={headerCellClassName}>역할</th>
              <th className={headerCellClassName}>작업</th>
              <th className={headerCellClassName}>모듈</th>
              <th className={headerCellClassName}>페이로드</th>
              <th className={headerCellClassName}>일시</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  활동 기록을 불러오는 중…
                </td>
              </tr>
            ) : result.items.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  조건에 맞는 활동 기록이 없습니다.
                </td>
              </tr>
            ) : (
              result.items.map((row) => (
                <AuditLogRow
                  key={row.id}
                  row={row}
                  onViewPayload={openPayload}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="shrink-0">
        <DataTablePagination
          page={result.page}
          totalPages={result.totalPages}
          rangeStart={result.rangeStart}
          rangeEnd={result.rangeEnd}
          total={result.total}
          onPageChange={onPageChange}
          disabled={loading}
        />
      </div>

      <ActivityLogPayloadDialog
        open={payloadOpen}
        onOpenChange={setPayloadOpen}
        payload={selectedPayload}
      />
    </div>
  );
}

function AuditLogRow({
  row,
  onViewPayload,
}: {
  row: AuditLogListItem;
  onViewPayload: (payload: Prisma.JsonValue | null) => void;
}) {
  const preview = summarizeAuditPayload(row.payload);

  return (
    <tr className="group border-b border-border/60 hover:bg-muted/30">
      <td className={`${bodyCellClassName} truncate font-medium`} title={row.actor.name}>
        {row.actor.name}
      </td>
      <td className={`${bodyCellClassName} truncate text-muted-foreground`}>
        {getRoleLabel(row.actor.role)}
      </td>
      <td className={`${bodyCellClassName} whitespace-nowrap`}>
        {getAuditActionLabel(row.action)}
      </td>
      <td className={`${bodyCellClassName} truncate`} title={getAuditTableNameLabel(row.tableName)}>
        {getAuditTableNameLabel(row.tableName)}
      </td>
      <td className={`${bodyCellClassName} min-w-0 overflow-hidden`}>
        <div className="flex min-w-0 items-center gap-2">
          <PayloadPreviewText text={preview} />
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="shrink-0"
            onClick={() => onViewPayload(row.payload)}
          >
            상세
          </Button>
        </div>
      </td>
      <td className={`${bodyCellClassName} whitespace-nowrap tabular-nums text-muted-foreground`}>
        {formatDateTime(new Date(row.createdAt))}
      </td>
    </tr>
  );
}

/** Width-aware truncation that always uses ASCII `...` when cut off. */
function PayloadPreviewText({ text }: { text: string }) {
  const measureRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const element = measureRef.current;
    if (!element) {
      return;
    }

    const fit = () => {
      const available = element.clientWidth;
      if (available <= 0) {
        return;
      }

      element.textContent = text;
      if (element.scrollWidth <= available) {
        return;
      }

      let low = 0;
      let high = text.length;
      while (low < high) {
        const mid = Math.ceil((low + high) / 2);
        element.textContent = `${text.slice(0, mid)}...`;
        if (element.scrollWidth <= available) {
          low = mid;
        } else {
          high = mid - 1;
        }
      }

      element.textContent = low > 0 ? `${text.slice(0, low)}...` : "...";
    };

    fit();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      fit();
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [text]);

  return (
    <span
      ref={measureRef}
      className="min-w-0 flex-1 overflow-hidden text-muted-foreground whitespace-nowrap"
      title={text}
    />
  );
}
