"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { UserCheck, X } from "lucide-react";

import { NO_WORKPLACE_MANAGEMENT_NUMBER_LABEL } from "@/lib/companies/labels";
import { formatWorkplaceManagementNumber } from "@/lib/format/workplace-management-number";
import { formatDateTime } from "@/lib/format/date";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const UNASSIGNED_STAFF_FILTER = "__unassigned__";

type StaffUserOption = {
  id: string;
  name: string;
  isActive: boolean;
};

type CompanyListItem = {
  id: string;
  name: string;
  firmContactName: string | null;
  workplaceManagementNumber: string | null;
  isActive: boolean;
  updatedAt: Date | string;
  _count: {
    newHires: number;
    terminations: number;
  };
};

type CompaniesListProps = {
  companies: CompanyListItem[];
  currentUserName: string;
  staffUsers: StaffUserOption[];
  initialQuery?: string;
};

export function CompaniesList({
  companies,
  currentUserName,
  staffUsers,
  initialQuery = "",
}: CompaniesListProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [staffFilter, setStaffFilter] = useState("");

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();

    return companies.filter((company) => {
      if (trimmed && !company.name.toLowerCase().includes(trimmed)) {
        return false;
      }

      if (staffFilter === UNASSIGNED_STAFF_FILTER) {
        return !company.firmContactName;
      }

      if (staffFilter) {
        return company.firmContactName === staffFilter;
      }

      return true;
    });
  }, [companies, query, staffFilter]);

  const { assignedToMe, activeUnassigned, inactive } = useMemo(() => {
    const assignedToMe = filtered.filter(
      (company) =>
        company.isActive &&
        !!currentUserName &&
        company.firmContactName === currentUserName,
    );

    const assignedIds = new Set(assignedToMe.map((company) => company.id));

    const activeUnassigned = filtered.filter(
      (company) => company.isActive && !assignedIds.has(company.id),
    );

    const inactive = filtered.filter((company) => !company.isActive);

    return { assignedToMe, activeUnassigned, inactive };
  }, [filtered, currentUserName]);

  const hasFilters = query.trim().length > 0 || staffFilter.length > 0;

  const clearFilters = () => {
    setQuery("");
    setStaffFilter("");
  };

  const CompanyGrid = ({ list }: { list: CompanyListItem[] }) => (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {list.map((company) => (
        <Link key={company.id} href={`/firm/companies/${company.id}`}>
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg">{company.name}</CardTitle>
                <div className="flex items-center gap-2">
                  {company.isActive &&
                  currentUserName &&
                  company.firmContactName === currentUserName ? (
                    <Badge
                      variant="outline"
                      className="gap-1 border-orange-200 bg-orange-50 text-orange-700"
                    >
                      <UserCheck className="size-3.5" />
                      담당
                    </Badge>
                  ) : null}
                  <Badge variant={company.isActive ? "default" : "secondary"}>
                    {company.isActive ? "활성" : "비활성"}
                  </Badge>
                </div>
              </div>
              <CardDescription className="font-mono">
                {formatWorkplaceManagementNumber(
                  company.workplaceManagementNumber,
                ) ?? NO_WORKPLACE_MANAGEMENT_NUMBER_LABEL}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                입사자 {company._count.newHires}건 · 퇴사자{" "}
                {company._count.terminations}건
              </p>
              <p className="text-xs">
                최종 수정: {formatDateTime(new Date(company.updatedAt))}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="w-full max-w-sm space-y-1.5">
          <Label htmlFor="company-name-search">회사명</Label>
          <Input
            id="company-name-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="회사명 검색"
          />
        </div>
        <div className="w-full max-w-xs space-y-1.5">
          <Label htmlFor="company-staff-filter">담당 직원</Label>
          <select
            id="company-staff-filter"
            value={staffFilter}
            onChange={(event) => setStaffFilter(event.target.value)}
            className={selectClassName}
          >
            <option value="">전체</option>
            <option value={UNASSIGNED_STAFF_FILTER}>미배정</option>
            {staffUsers
              .filter((user) => user.isActive)
              .map((user) => (
                <option key={user.id} value={user.name}>
                  {user.name}
                </option>
              ))}
          </select>
        </div>
        <Button type="button" variant="secondary" onClick={() => router.refresh()}>
          검색
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={clearFilters}
          disabled={!hasFilters}
        >
          <X />
          필터 초기화
        </Button>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">담당</p>
            <p className="text-xs text-muted-foreground">{assignedToMe.length}개</p>
          </div>
          {assignedToMe.length > 0 ? <CompanyGrid list={assignedToMe} /> : null}
        </div>

        <hr className="border-border/60" />

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">활성</p>
            <p className="text-xs text-muted-foreground">{activeUnassigned.length}개</p>
          </div>
          {activeUnassigned.length > 0 ? (
            <CompanyGrid list={activeUnassigned} />
          ) : null}
        </div>

        <hr className="border-border/60" />

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">비활성</p>
            <p className="text-xs text-muted-foreground">{inactive.length}개</p>
          </div>
          {inactive.length > 0 ? <CompanyGrid list={inactive} /> : null}
        </div>
      </div>
    </div>
  );
}
