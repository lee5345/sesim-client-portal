"use client";

import { useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type CopySourceMonth = {
  year: number;
  month: number;
};

type CopyRecentPeopleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId?: string;
  targetYear: number;
  targetMonth: number;
  hasExistingEntries: boolean;
  listNoun: "인원" | "재직자";
  existingModeDescription: string;
  isPending: boolean;
  loadSource: (input: {
    companyId: string;
    year: number;
    month: number;
  }) => Promise<CopySourceMonth | null>;
  onCopy: (mode: "overwrite" | "append") => void;
};

export function CopyRecentPeopleDialog({
  open,
  onOpenChange,
  companyId,
  targetYear,
  targetMonth,
  hasExistingEntries,
  listNoun,
  existingModeDescription,
  isPending,
  loadSource,
  onCopy,
}: CopyRecentPeopleDialogProps) {
  const [source, setSource] = useState<CopySourceMonth | null>(null);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    if (!open) {
      setSource(null);
      setResolved(false);
      return;
    }

    if (!companyId) {
      setSource(null);
      setResolved(true);
      return;
    }

    let cancelled = false;
    setSource(null);
    setResolved(false);

    void loadSource({
      companyId,
      year: targetYear,
      month: targetMonth,
    })
      .then((result) => {
        if (cancelled) return;
        setSource(result);
        setResolved(true);
      })
      .catch(() => {
        if (cancelled) return;
        setSource(null);
        setResolved(true);
      });

    return () => {
      cancelled = true;
    };
  }, [companyId, loadSource, open, targetMonth, targetYear]);

  const sourceLoading = open && !resolved;
  const hasSource = resolved && source !== null;

  const title =
    hasSource && hasExistingEntries ? "복사 방식 선택" : "최근 인원 복사";

  let description: string | ReactNode = "복사할 이전 기간 확인 중...";
  if (hasSource && source) {
    description = hasExistingEntries ? (
      <>
        {existingModeDescription}
        <span className="mt-2 block">
          복사 대상 기간: {source.year}년 {source.month}월
        </span>
      </>
    ) : (
      <>
        {targetYear}년 {targetMonth}월보다 이전 기간 중 가장 최근인 {source.year}년{" "}
        {source.month}월의 {listNoun} 목록을 복사합니다.
      </>
    );
  } else if (resolved) {
    description = `${targetYear}년 ${targetMonth}월 이전 ${listNoun} 기록이 없습니다. 이후 기간의 기록은 복사할 수 없습니다.`;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter
          className={
            hasSource && hasExistingEntries ? "gap-2 sm:justify-end" : undefined
          }
        >
          {sourceLoading ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              취소
            </Button>
          ) : hasSource ? (
            hasExistingEntries ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isPending}
                >
                  취소
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => onCopy("append")}
                >
                  추가하기
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isPending}
                  onClick={() => onCopy("overwrite")}
                >
                  덮어쓰기
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isPending}
                >
                  취소
                </Button>
                <Button
                  type="button"
                  disabled={isPending}
                  onClick={() => onCopy("append")}
                >
                  복사
                </Button>
              </>
            )
          ) : (
            <Button type="button" onClick={() => onOpenChange(false)}>
              확인
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
