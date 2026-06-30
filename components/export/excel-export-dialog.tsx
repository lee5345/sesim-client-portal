"use client";

import { useEffect, useState, useTransition } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatExportDefaultTitle } from "@/lib/export/default-title";
import { downloadExcelExport } from "@/lib/export/download";
import type { ExportFilterSummaryItem } from "@/lib/export/filter-summaries";
import type { ExcelExportResult } from "@/lib/export/types";

type ExcelExportDialogProps = {
  moduleLabel: string;
  defaultTitle: string;
  companyName?: string;
  filterSummary: ExportFilterSummaryItem[];
  entryCount: number;
  disabled?: boolean;
  companyId?: string;
  onExport: (input: { title: string; companyId?: string }) => Promise<ExcelExportResult>;
};

export function ExcelExportDialog({
  moduleLabel,
  defaultTitle,
  companyName,
  filterSummary,
  entryCount,
  disabled = false,
  companyId,
  onExport,
}: ExcelExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"confirm" | "title">("confirm");
  const initialTitle = formatExportDefaultTitle(defaultTitle, companyName);
  const [title, setTitle] = useState(initialTitle);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      return;
    }
    setStep("confirm");
    setTitle(formatExportDefaultTitle(defaultTitle, companyName));
    setError(null);
  }, [open, defaultTitle, companyName]);

  function handleClose() {
    setOpen(false);
  }

  function handleConfirmFilters() {
    if (entryCount === 0) {
      setError("다운로드할 항목이 없습니다. 필터 조건을 확인해 주세요.");
      return;
    }
    setError(null);
    setStep("title");
  }

  function handleDownload() {
    setError(null);
    startTransition(async () => {
      const result = await onExport({ title, companyId });
      if (!result.success) {
        setError(result.error);
        return;
      }
      downloadExcelExport(result);
      handleClose();
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        <Download />
        Excel 다운로드
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {step === "confirm" ? "다운로드 조건 확인" : "파일 제목 입력"}
            </DialogTitle>
            <DialogDescription>
              {step === "confirm"
                ? `${moduleLabel} 다운로드 조건을 확인한 후 계속 진행합니다.`
                : "저장할 엑셀 파일의 제목을 입력해 주세요."}
            </DialogDescription>
          </DialogHeader>

          {error ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          {step === "confirm" ? (
            <div className="space-y-3">
              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  적용된 필터
                </p>
                <dl className="space-y-2">
                  {filterSummary.map((item) => (
                    <div
                      key={item.label}
                      className="grid grid-cols-[5.5rem_1fr] gap-2 text-sm"
                    >
                      <dt className="text-muted-foreground">{item.label}</dt>
                      <dd className="font-medium break-words">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <p className="text-sm text-muted-foreground">
                총 <span className="font-semibold text-foreground">{entryCount}</span>
                건이 포함됩니다.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="excel-export-title">파일 제목</Label>
              <Input
                id="excel-export-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="예: 2026년 1월 입사자 목록"
                maxLength={120}
                disabled={isPending}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                `.xlsx` 확장자는 자동으로 추가됩니다.
              </p>
            </div>
          )}

          <DialogFooter>
            {step === "confirm" ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isPending}
                >
                  취소
                </Button>
                <Button type="button" onClick={handleConfirmFilters} disabled={isPending}>
                  계속
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setError(null);
                    setStep("confirm");
                  }}
                  disabled={isPending}
                >
                  이전
                </Button>
                <Button
                  type="button"
                  onClick={handleDownload}
                  disabled={isPending || !title.trim()}
                >
                  <Download />
                  다운로드
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
