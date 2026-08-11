"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ActivityLogCompanyList } from "@/components/firm/activity-log/activity-log-company-list";
import { ActivityLogFilters } from "@/components/firm/activity-log/activity-log-filters";
import { ActivityLogTable } from "@/components/firm/activity-log/activity-log-table";
import { PageHeader } from "@/components/layout/page-header";
import { CRUD_PAGE_SIZE } from "@/lib/constants/pagination";
import {
  EMPTY_AUDIT_LOG_FILTERS,
  type AuditLogFilterValues,
} from "@/lib/filters/audit-logs";
import {
  listAuditLogActors,
  listAuditLogs,
  type AuditLogActorOption,
  type AuditLogListResult,
} from "@/modules/audit-logs/actions";

export type ActivityLogCompanyOption = {
  id: string;
  name: string;
  isActive: boolean;
};

type ActivityLogPageProps = {
  companies: ActivityLogCompanyOption[];
  initialCompanyId: string | null;
};

function emptyResult(page = 1): AuditLogListResult {
  return {
    items: [],
    page,
    pageSize: CRUD_PAGE_SIZE,
    total: 0,
    totalPages: 1,
    rangeStart: 0,
    rangeEnd: 0,
  };
}

export function ActivityLogPage({
  companies,
  initialCompanyId,
}: ActivityLogPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeCompanies = useMemo(
    () => companies.filter((company) => company.isActive),
    [companies],
  );

  const [companySearch, setCompanySearch] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    initialCompanyId &&
      activeCompanies.some((company) => company.id === initialCompanyId)
      ? initialCompanyId
      : null,
  );

  const [draftFilters, setDraftFilters] = useState<AuditLogFilterValues>(
    EMPTY_AUDIT_LOG_FILTERS,
  );
  const [appliedFilters, setAppliedFilters] = useState<AuditLogFilterValues>(
    EMPTY_AUDIT_LOG_FILTERS,
  );
  const [page, setPage] = useState(1);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [actors, setActors] = useState<AuditLogActorOption[]>([]);
  const [result, setResult] = useState<AuditLogListResult>(emptyResult());
  const [loading, setLoading] = useState(false);

  const filteredCompanies = useMemo(() => {
    const query = companySearch.trim().toLowerCase();
    if (!query) return activeCompanies;
    return activeCompanies.filter((company) =>
      company.name.toLowerCase().includes(query),
    );
  }, [activeCompanies, companySearch]);

  const selectedCompanyName = useMemo(
    () =>
      activeCompanies.find((company) => company.id === selectedCompanyId)
        ?.name ?? null,
    [activeCompanies, selectedCompanyId],
  );

  const syncCompanyIdToUrl = useCallback(
    (companyId: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (companyId) {
        params.set("companyId", companyId);
      } else {
        params.delete("companyId");
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (!selectedCompanyId) {
      setActors([]);
      return;
    }

    let cancelled = false;

    void listAuditLogActors(selectedCompanyId).then((nextActors) => {
      if (!cancelled) {
        setActors(nextActors);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selectedCompanyId]);

  useEffect(() => {
    if (!selectedCompanyId) {
      setResult(emptyResult());
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void listAuditLogs(selectedCompanyId, appliedFilters, page).then(
      (nextResult) => {
        if (cancelled) return;
        setResult(nextResult);
        setLoading(false);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [selectedCompanyId, appliedFilters, page, reloadNonce]);

  function handleSelectCompany(companyId: string) {
    setSelectedCompanyId(companyId);
    setDraftFilters(EMPTY_AUDIT_LOG_FILTERS);
    setAppliedFilters(EMPTY_AUDIT_LOG_FILTERS);
    setPage(1);
    setActors([]);
    setResult(emptyResult());
    setLoading(true);
    setReloadNonce((nonce) => nonce + 1);
    syncCompanyIdToUrl(companyId);
  }

  function handleDraftChange(next: AuditLogFilterValues) {
    setDraftFilters(next);
  }

  function handleSearch() {
    setAppliedFilters({ ...draftFilters });
    setPage(1);
    setResult(emptyResult());
    setLoading(true);
    setReloadNonce((nonce) => nonce + 1);
  }

  function handleClear() {
    setDraftFilters(EMPTY_AUDIT_LOG_FILTERS);
    setAppliedFilters(EMPTY_AUDIT_LOG_FILTERS);
    setPage(1);
    setResult(emptyResult());
    setLoading(true);
    setReloadNonce((nonce) => nonce + 1);
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col gap-6 overflow-hidden md:h-[calc(100vh-4rem)]">
      <PageHeader
        title="활동 기록 보관함"
        description="고객사별 데이터 등록·수정·삭제 이력을 조회합니다."
      />

      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm">
        <ActivityLogCompanyList
          companies={filteredCompanies}
          selectedCompanyId={selectedCompanyId}
          search={companySearch}
          onSearchChange={setCompanySearch}
          onSelect={handleSelectCompany}
        />

        <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden p-4 md:p-6">
          {!selectedCompanyId ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-sm text-muted-foreground">
                고객사를 선택하세요.
              </p>
            </div>
          ) : (
            <>
              <div className="shrink-0">
                <h2 className="text-lg font-semibold tracking-tight">
                  {selectedCompanyName}
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  선택한 고객사의 활동 기록입니다.
                </p>
              </div>

              <div className="shrink-0">
                <ActivityLogFilters
                  actors={actors}
                  draft={draftFilters}
                  onDraftChange={handleDraftChange}
                  onSearch={handleSearch}
                  onClear={handleClear}
                  disabled={loading}
                />
              </div>

              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                <ActivityLogTable
                  result={result}
                  onPageChange={setPage}
                  loading={loading}
                />
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
