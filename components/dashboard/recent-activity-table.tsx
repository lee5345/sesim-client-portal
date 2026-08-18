import {
  ActivityTypeBadge,
  getDashboardActivityHref,
  type DashboardActivityType,
} from "@/components/dashboard/activity-type-badge";
import { formatRelativeTime } from "@/lib/format/date";

export type RecentActivityTableRow = {
  id: string;
  name: string;
  type: DashboardActivityType;
  relevantDate: string;
  createdByName: string;
  createdAt: Date;
  companyId?: string;
  companyName?: string;
  year?: number;
  month?: number;
};

type RecentActivityTableProps = {
  rows: RecentActivityTableRow[];
  showCompany?: boolean;
  linkMode: "client" | "firm";
};

export function RecentActivityTable({
  rows,
  showCompany = false,
  linkMode,
}: RecentActivityTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-left">
            <th className="px-4 py-3.5 font-medium">이름</th>
            {showCompany ? <th className="px-4 py-3.5 font-medium">고객사</th> : null}
            <th className="px-4 py-3.5 font-medium">해당일</th>
            <th className="px-4 py-3.5 font-medium">유형</th>
            <th className="px-4 py-3.5 font-medium">등록자</th>
            <th className="px-4 py-3.5 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b last:border-0">
              <td className="px-4 py-3.5">{row.name}</td>
              {showCompany ? <td className="px-4 py-3.5">{row.companyName ?? "—"}</td> : null}
              <td className="px-4 py-3.5 text-muted-foreground">
                {row.relevantDate}
              </td>
              <td className="px-4 py-3.5">
                <ActivityTypeBadge
                  type={row.type}
                  href={getDashboardActivityHref({
                    type: row.type,
                    mode: linkMode,
                    companyId: row.companyId,
                    year: row.year,
                    month: row.month,
                  })}
                />
              </td>
              <td className="px-4 py-3.5">{row.createdByName}</td>
              <td className="px-4 py-3.5 text-muted-foreground">
                {formatRelativeTime(row.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
