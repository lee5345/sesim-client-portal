"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { ClipboardList, Copy } from "lucide-react";

import { BusinessIncomeFormDialog } from "@/components/client/business-income-form-dialog";
import { ExcelExportDialog } from "@/components/export/excel-export-dialog";
import { BusinessIncomeTableView } from "@/components/business-income/business-income-table-view";
import { BusinessIncomeMonthSelector } from "@/components/business-income/business-income-month-selector";
import { EmptyState } from "@/components/dashboard/empty-state";
import { EMPTY_BUSINESS_INCOME_FILTERS } from "@/lib/filters/business-income";
import type { BusinessIncomeFilterValues } from "@/lib/filters/business-income";
import type { BusinessIncomeTableRow } from "@/lib/business-income/types";
import { summarizeBusinessIncomeFilters } from "@/lib/export/filter-summaries";
import { filterBusinessIncomes } from "@/lib/filters/business-income";
import { exportBusinessIncomesExcel } from "@/modules/business-income/export";
import { copyBusinessIncomeNamesFromMostRecentMonth } from "@/modules/business-income/actions";
import { NewEntriesControls } from "@/components/layout/new-entries-controls";
import { listUnreadTenantChangeEntityIdsAction } from "@/lib/realtime/sync-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type BusinessIncomeTableProps = {
  businessIncomes: BusinessIncomeTableRow[];
  year: number;
  month: number;
  companyId?: string;
  companyName?: string;
  basePath?: string;
};

function clearShowUnreadParam(
  basePath: string,
  searchParams: URLSearchParams,
): string {
  const params = new URLSearchParams(searchParams.toString());
  params.delete("showUnread");
  return `${basePath}?${params.toString()}`;
}

export function BusinessIncomeTable({
  businessIncomes,
  year,
  month,
  companyId,
  companyName,
  basePath = "/client/business-income",
}: BusinessIncomeTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showUnread = searchParams.get("showUnread") === "1";
  const [unreadIds, setUnreadIds] = useState<Set<string> | null>(null);
  const [reviewActive, setReviewActive] = useState(false);
  const [draftFilters, setDraftFilters] = useState<BusinessIncomeFilterValues>(
    EMPTY_BUSINESS_INCOME_FILTERS,
  );
  const [appliedFilters, setAppliedFilters] = useState<BusinessIncomeFilterValues>(
    EMPTY_BUSINESS_INCOME_FILTERS,
  );
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [copyModeDialogOpen, setCopyModeDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const defaultTitle = `${year}년 ${month}월 사업소득 정보`;

  const filteredBusinessIncomes = useMemo(
    () => filterBusinessIncomes(businessIncomes, appliedFilters),
    [businessIncomes, appliedFilters],
  );

  const visibleBusinessIncomes = useMemo(() => {
    if (!unreadIds) {
      return filteredBusinessIncomes;
    }
    return filteredBusinessIncomes.filter((row) => unreadIds.has(row.id));
  }, [filteredBusinessIncomes, unreadIds]);

  const filterSummary = useMemo(
    () => summarizeBusinessIncomeFilters(year, month, appliedFilters),
    [year, month, appliedFilters],
  );

  function showUnreadEntriesForPeriod(ids: string[]) {
    setDraftFilters(EMPTY_BUSINESS_INCOME_FILTERS);
    setAppliedFilters(EMPTY_BUSINESS_INCOME_FILTERS);
    setUnreadIds(new Set(ids));
  }

  useEffect(() => {
    if (!companyId || !showUnread) {
      return;
    }

    router.replace(
      clearShowUnreadParam(basePath, new URLSearchParams(searchParams.toString())),
      { scroll: false },
    );

    void (async () => {
      const ids = await listUnreadTenantChangeEntityIdsAction({
        companyId,
        entityTypes: ["BUSINESS_INCOME"],
        periodYear: year,
        periodMonth: month,
      });
      showUnreadEntriesForPeriod(ids);
      setReviewActive(true);
    })();
  }, [basePath, companyId, month, router, searchParams, showUnread, year]);

  function handleDraftChange(next: BusinessIncomeFilterValues) {
    setDraftFilters(next);
    setAppliedFilters(next);
  }

  function handleSearch() {
    setAppliedFilters(draftFilters);
  }

  function handleClear() {
    setDraftFilters(EMPTY_BUSINESS_INCOME_FILTERS);
    setAppliedFilters(EMPTY_BUSINESS_INCOME_FILTERS);
  }

  function handleCopyClick() {
    if (businessIncomes.length > 0) {
      setCopyModeDialogOpen(true);
      return;
    }
    setCopyDialogOpen(true);
  }

  function runCopy(mode: "overwrite" | "append") {
    if (!companyId) {
      return;
    }

    startTransition(async () => {
      await copyBusinessIncomeNamesFromMostRecentMonth({
        companyId,
        year,
        month,
        mode,
      });
      setCopyDialogOpen(false);
      setCopyModeDialogOpen(false);
      router.refresh();
    });
  }

  return (
    <Card className="min-w-0">
      <CardHeader className="flex shrink-0 flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="size-4 text-primary" />
            사업소득 목록
          </CardTitle>
          <CardDescription>
            {year}년 {month}월 사업소득 정보를 관리합니다.
          </CardDescription>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {companyId ? (
            <NewEntriesControls
              companyId={companyId}
              entityTypes={["BUSINESS_INCOME"]}
              periodScope={{ year, month, basePath }}
              reviewActive={reviewActive}
              onReviewActiveChange={setReviewActive}
              onShowUnreadEntries={showUnreadEntriesForPeriod}
              onClearUnreadFilter={() => setUnreadIds(null)}
            />
          ) : null}
          <ExcelExportDialog
            moduleLabel="사업소득 정보"
            defaultTitle={defaultTitle}
            companyName={companyName}
            filterSummary={filterSummary}
            entryCount={visibleBusinessIncomes.length}
            companyId={companyId}
            onExport={({ title }) =>
              exportBusinessIncomesExcel({
                title,
                year,
                month,
                filters: appliedFilters,
                companyId,
              })
            }
          />
          <BusinessIncomeFormDialog
            mode="create"
            year={year}
            month={month}
            companyId={companyId}
          />
        </div>
      </CardHeader>
      <CardContent className="min-w-0 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <BusinessIncomeMonthSelector
            year={year}
            month={month}
            basePath={basePath}
            disabled={isPending}
          />
          <Button
            type="button"
            variant="outline"
            className="h-8 shrink-0 self-end"
            disabled={isPending || !companyId}
            onClick={handleCopyClick}
          >
            <Copy className="size-4" />
            최근 인원 복사
          </Button>
        </div>

        {businessIncomes.length === 0 ? (
          <EmptyState message="등록된 사업소득 정보가 없습니다. 사업소득 등록 버튼으로 첫 항목을 추가해 주세요." />
        ) : (
          <BusinessIncomeTableView
            businessIncomes={visibleBusinessIncomes}
            year={year}
            month={month}
            companyId={companyId}
            hasBaseRows={businessIncomes.length > 0}
            draftFilters={draftFilters}
            appliedFilters={appliedFilters}
            onDraftChange={handleDraftChange}
            onSearch={handleSearch}
            onClear={handleClear}
            disabled={isPending}
          />
        )}
      </CardContent>

      <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>최근 인원 복사</DialogTitle>
            <DialogDescription>
              가장 최근에 기록이 있는 월의 인원 목록을 {year}년 {month}월로
              복사합니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCopyDialogOpen(false)}
              disabled={isPending}
            >
              취소
            </Button>
            <Button
              type="button"
              disabled={isPending}
              onClick={() => runCopy("append")}
            >
              복사
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={copyModeDialogOpen} onOpenChange={setCopyModeDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>복사 방식 선택</DialogTitle>
            <DialogDescription>
              {year}년 {month}월에 이미 등록된 항목이 있습니다. 덮어쓰기는 기존
              항목을 삭제한 뒤 이름만 복사하고, 추가하기는 기존 인원을 유지한 채
              새 인원만 추가합니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCopyModeDialogOpen(false)}
              disabled={isPending}
            >
              취소
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => runCopy("append")}
            >
              추가하기
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={() => runCopy("overwrite")}
            >
              덮어쓰기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
