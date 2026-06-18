"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { UserCheck } from "lucide-react";

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
  initialQuery?: string;
};

export function CompaniesList({
  companies,
  currentUserName,
  initialQuery = "",
}: CompaniesListProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return companies;
    return companies.filter((company) =>
      company.name.toLowerCase().includes(trimmed),
    );
  }, [companies, query]);

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

  const emptyMessage = query.trim() ? "검색 결과가 없습니다." : "등록된 고객사가 없습니다.";

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
      <div className="flex max-w-sm gap-2">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="회사명 검색"
        />
        <Button type="button" variant="secondary" onClick={() => router.refresh()}>
          검색
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {emptyMessage}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">담당</p>
              <p className="text-xs text-muted-foreground">{assignedToMe.length}개</p>
            </div>
            {assignedToMe.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  담당 고객사가 없습니다.
                </CardContent>
              </Card>
            ) : (
              <CompanyGrid list={assignedToMe} />
            )}
          </div>

          <hr className="border-border/60" />

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">활성</p>
              <p className="text-xs text-muted-foreground">{activeUnassigned.length}개</p>
            </div>
            {activeUnassigned.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  활성 고객사가 없습니다.
                </CardContent>
              </Card>
            ) : (
              <CompanyGrid list={activeUnassigned} />
            )}
          </div>

          <hr className="border-border/60" />

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">비활성</p>
              <p className="text-xs text-muted-foreground">{inactive.length}개</p>
            </div>
            {inactive.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  비활성 고객사가 없습니다.
                </CardContent>
              </Card>
            ) : (
              <CompanyGrid list={inactive} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
