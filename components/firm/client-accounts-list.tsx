"use client";

import { useMemo, useState } from "react";
import { Building2, Users } from "lucide-react";

import { OPTIONAL_FIELD_EMPTY_LABEL } from "@/lib/companies/labels";
import { formatDate } from "@/lib/format/date";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ClientAccount = {
  id: string;
  name: string;
  email: string;
  signupPhone: string | null;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: Date | string;
};

function formatSignupPhone(signupPhone: string | null) {
  return signupPhone?.trim() ? signupPhone : OPTIONAL_FIELD_EMPTY_LABEL;
}

type CompanyGroup = {
  id: string;
  name: string;
  isActive: boolean;
  users: ClientAccount[];
};

type ClientAccountsListProps = {
  companies: CompanyGroup[];
  unassigned: ClientAccount[];
  toggleAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
};

function matchesQuery(account: ClientAccount, companyName: string, query: string) {
  const phone = formatSignupPhone(account.signupPhone);
  const haystack =
    `${account.name} ${account.email} ${phone} ${companyName}`.toLowerCase();
  return haystack.includes(query);
}

const ACCOUNT_TABLE_COLUMN_CLASS = {
  name: "w-[11%]",
  email: "w-[26%]",
  phone: "w-[13%]",
  status: "w-[17%]",
  created: "w-[13%]",
  actions: "w-[20%]",
} as const;

function AccountTableColGroup() {
  return (
    <colgroup>
      <col className={ACCOUNT_TABLE_COLUMN_CLASS.name} />
      <col className={ACCOUNT_TABLE_COLUMN_CLASS.email} />
      <col className={ACCOUNT_TABLE_COLUMN_CLASS.phone} />
      <col className={ACCOUNT_TABLE_COLUMN_CLASS.status} />
      <col className={ACCOUNT_TABLE_COLUMN_CLASS.created} />
      <col className={ACCOUNT_TABLE_COLUMN_CLASS.actions} />
    </colgroup>
  );
}

function AccountRow({
  account,
  toggleAction,
  deleteAction,
}: {
  account: ClientAccount;
  toggleAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  return (
    <tr className="border-b last:border-0 hover:bg-muted/20">
      <td className="truncate px-4 py-3 font-medium">{account.name}</td>
      <td className="truncate px-4 py-3 text-muted-foreground">{account.email}</td>
      <td className="truncate px-4 py-3 text-muted-foreground">
        {formatSignupPhone(account.signupPhone)}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1.5">
          <Badge
            variant={account.isActive ? "outline" : "destructive"}
            className={
              account.isActive
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : undefined
            }
          >
            {account.isActive ? "활성" : "비활성"}
          </Badge>
          {account.mustChangePassword ? (
            <Badge variant="secondary">비번 설정 필요</Badge>
          ) : null}
        </div>
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {formatDate(new Date(account.createdAt))}
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">
          <form action={toggleAction}>
            <input type="hidden" name="userId" value={account.id} />
            <input
              type="hidden"
              name="isActive"
              value={account.isActive ? "false" : "true"}
            />
            <Button type="submit" variant="outline" size="sm">
              {account.isActive ? "비활성화" : "활성화"}
            </Button>
          </form>
          <ConfirmDeleteDialog
            title="고객 계정 삭제"
            description={`"${account.name}" (${account.email}) 계정을 삭제하시겠습니까? 활동 기록이 있는 계정은 비활성화됩니다.`}
            action={deleteAction}
            hiddenFields={{ userId: account.id }}
            triggerLabel="삭제"
          />
        </div>
      </td>
    </tr>
  );
}

function AccountsTable({
  accounts,
  toggleAction,
  deleteAction,
}: {
  accounts: ClientAccount[];
  toggleAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  if (accounts.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        등록된 계정이 없습니다.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full table-fixed text-sm">
        <AccountTableColGroup />
        <thead>
          <tr className="border-b bg-muted/40 text-left">
            <th className={`px-4 py-3 font-medium ${ACCOUNT_TABLE_COLUMN_CLASS.name}`}>
              이름
            </th>
            <th className={`px-4 py-3 font-medium ${ACCOUNT_TABLE_COLUMN_CLASS.email}`}>
              이메일
            </th>
            <th className={`px-4 py-3 font-medium ${ACCOUNT_TABLE_COLUMN_CLASS.phone}`}>
              전화번호
            </th>
            <th className={`px-4 py-3 font-medium ${ACCOUNT_TABLE_COLUMN_CLASS.status}`}>
              상태
            </th>
            <th className={`px-4 py-3 font-medium ${ACCOUNT_TABLE_COLUMN_CLASS.created}`}>
              생성일
            </th>
            <th
              className={`px-4 py-3 text-right font-medium ${ACCOUNT_TABLE_COLUMN_CLASS.actions}`}
            >
              관리
            </th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => (
            <AccountRow
              key={account.id}
              account={account}
              toggleAction={toggleAction}
              deleteAction={deleteAction}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ClientAccountsList({
  companies,
  unassigned,
  toggleAction,
  deleteAction,
}: ClientAccountsListProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return { companies, unassigned };
    }

    const filteredCompanies = companies
      .map((company) => ({
        ...company,
        users: company.users.filter((account) =>
          matchesQuery(account, company.name, trimmed),
        ),
      }))
      .filter(
        (company) =>
          company.users.length > 0 ||
          company.name.toLowerCase().includes(trimmed),
      );

    const filteredUnassigned = unassigned.filter((account) =>
      matchesQuery(account, "미연결", trimmed),
    );

    return { companies: filteredCompanies, unassigned: filteredUnassigned };
  }, [companies, unassigned, query]);

  const totalAccounts =
    companies.reduce((sum, company) => sum + company.users.length, 0) +
    unassigned.length;

  const visibleAccounts =
    filtered.companies.reduce((sum, company) => sum + company.users.length, 0) +
    filtered.unassigned.length;

  const hasResults =
    filtered.companies.some((company) => company.users.length > 0) ||
    filtered.unassigned.length > 0 ||
    (query.trim() &&
      filtered.companies.some((company) =>
        company.name.toLowerCase().includes(query.trim().toLowerCase()),
      ));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-sm flex-1">
          <Label htmlFor="account-search" className="mb-2 block">
            계정 검색
          </Label>
          <Input
            id="account-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="이름, 이메일, 고객사명"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          전체 {totalAccounts}개 계정
          {query.trim() ? ` · 검색 결과 ${visibleAccounts}개` : null}
        </p>
      </div>

      {totalAccounts === 0 && !query.trim() ? (
        <Card className="shadow-sm">
          <CardContent className="py-12">
            <EmptyState message="등록된 고객 계정이 없습니다." />
          </CardContent>
        </Card>
      ) : !hasResults ? (
        <Card className="shadow-sm">
          <CardContent className="py-12 text-center text-muted-foreground">
            검색 결과가 없습니다.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.companies.map((company) => {
            const showCompany =
              company.users.length > 0 ||
              (!query.trim() && company.users.length === 0);

            if (!showCompany) return null;

            return (
              <Card key={company.id} className="shadow-sm">
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Building2 className="size-4 text-primary" />
                        {company.name}
                        <Badge variant="secondary">{company.users.length}명</Badge>
                      </CardTitle>
                      <CardDescription>고객사 관리자 계정</CardDescription>
                    </div>
                    <Badge variant={company.isActive ? "default" : "secondary"}>
                      {company.isActive ? "고객사 활성" : "고객사 비활성"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <AccountsTable
                    accounts={company.users}
                    toggleAction={toggleAction}
                    deleteAction={deleteAction}
                  />
                </CardContent>
              </Card>
            );
          })}

          {filtered.unassigned.length > 0 ? (
            <Card className="border-dashed shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="size-4 text-primary" />
                  미연결 계정
                  <Badge variant="secondary">{filtered.unassigned.length}명</Badge>
                </CardTitle>
                <CardDescription>
                  고객사에 연결되지 않은 관리자 계정입니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AccountsTable
                  accounts={filtered.unassigned}
                  toggleAction={toggleAction}
                  deleteAction={deleteAction}
                />
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}
    </div>
  );
}
