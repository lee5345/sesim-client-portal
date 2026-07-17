import type { Metadata } from "next";

import { requireAuth } from "@/lib/auth/guards";
import { LeaveRecordsTable } from "@/components/client/leave-records-table";
import { formatDate } from "@/lib/format/date";
import { listLeaveRecords } from "@/modules/leave-records/actions";

export const metadata: Metadata = {
  title: "휴직자 등 정보",
};

export default async function ClientLeaveRecordsPage() {
  const session = await requireAuth("CLIENT_ADMIN");
  const companyId = session.user.companyId;

  if (!companyId) {
    return <p className="text-muted-foreground">소속 회사 정보가 없습니다.</p>;
  }

  const leaveRecords = await listLeaveRecords(companyId);

  const rows = leaveRecords.map((row) => ({
    ...row,
    periodStart: formatDate(row.periodStart),
    periodEnd: formatDate(row.periodEnd),
    expectedDeliveryDate: row.expectedDeliveryDate
      ? formatDate(row.expectedDeliveryDate)
      : null,
    createdAt: row.createdAt.toISOString(),
  }));

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">휴직자 등 정보</h1>
        <p className="mt-1 text-muted-foreground">
          각종 휴직자 등의 정보를 등록하고 관리합니다.
        </p>
      </div>

      <LeaveRecordsTable leaveRecords={rows} companyId={companyId} />
    </div>
  );
}
