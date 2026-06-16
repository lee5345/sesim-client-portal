"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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
  initialQuery?: string;
};

export function CompaniesList({ companies, initialQuery = "" }: CompaniesListProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return companies;
    return companies.filter((company) =>
      company.name.toLowerCase().includes(trimmed),
    );
  }, [companies, query]);

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
            {query.trim() ? "검색 결과가 없습니다." : "등록된 고객사가 없습니다."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((company) => (
            <Link key={company.id} href={`/firm/companies/${company.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{company.name}</CardTitle>
                    <Badge variant={company.isActive ? "default" : "secondary"}>
                      {company.isActive ? "활성" : "비활성"}
                    </Badge>
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
      )}
    </div>
  );
}
