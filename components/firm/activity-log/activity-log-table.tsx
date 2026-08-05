"use client";

import { useState } from "react";

import { ActivityLogPayloadDialog } from "@/components/firm/activity-log/activity-log-payload-dialog";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Button } from "@/components/ui/button";
import { getRoleLabel } from "@/lib/auth/roles";
import { summarizeAuditPayload } from "@/lib/filters/audit-logs";
import { formatAuditTimestamp } from "@/lib/format/audit-timestamp";
import type { AuditLogListItem, AuditLogListResult } from "@/modules/audit-logs/actions";
import {
  getAuditActionLabel,
  getAuditTableNameLabel,
} from "@/modules/audit-logs/labels";
import type { Prisma } from "@/lib/generated/prisma/client";

const headerCellClassName =
  "border-r border-border/30 px-4 py-3 text-left font-medium whitespace-nowrap last:border-r-0";
const bodyCellClassName =
  "border-r border-border/30 px-4 py-3 align-middle last:border-r-0";

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
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[56rem] border-collapse text-sm">
          <thead className="sticky top-0 z-10 border-b border-border/60 bg-muted">
            <tr>
              <th className={headerCellClassName}>사용자</th>
              <th className={headerCellClassName}>역할</th>
              <th className={headerCellClassName}>작업</th>
              <th className={headerCellClassName}>모듈</th>
              <th className={headerCellClassName}>변경 내용</th>
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
      <td className={`${bodyCellClassName} whitespace-nowrap font-medium`}>
        {row.actor.name}
      </td>
      <td className={`${bodyCellClassName} whitespace-nowrap text-muted-foreground`}>
        {getRoleLabel(row.actor.role)}
      </td>
      <td className={`${bodyCellClassName} whitespace-nowrap`}>
        {getAuditActionLabel(row.action)}
      </td>
      <td className={`${bodyCellClassName} whitespace-nowrap`}>
        {getAuditTableNameLabel(row.tableName)}
      </td>
      <td className={`${bodyCellClassName} max-w-0 w-[30%]`}>
        <div className="flex min-w-0 items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-muted-foreground" title={preview}>
            {preview}
          </span>
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
      <td className={`${bodyCellClassName} font-mono text-xs whitespace-nowrap tabular-nums`}>
        {formatAuditTimestamp(row.createdAt)}
      </td>
    </tr>
  );
}
