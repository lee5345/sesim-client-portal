"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { parseFourDigitYear } from "@/lib/validation/year";

const selectClassName =
  "h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
const yearInputClassName = `${selectClassName} w-28`;

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1);

type DailyWorkersMonthSelectorProps = {
  year: number;
  month: number;
  basePath: string;
};

export function DailyWorkersMonthSelector({
  year,
  month,
  basePath,
}: DailyWorkersMonthSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = useMemo(() => new Date(), []);
  const currentYear = current.getFullYear();
  const currentMonth = current.getMonth() + 1;
  const [yearDraft, setYearDraft] = useState(String(year));
  const [monthDraft, setMonthDraft] = useState(month);
  const [yearInvalid, setYearInvalid] = useState(false);
  const [yearErrorDialogOpen, setYearErrorDialogOpen] = useState(false);

  function navigate(nextYear: number, nextMonth: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", String(nextYear));
    params.set("month", String(nextMonth));
    if (basePath.includes("/firm/companies/")) {
      params.set("tab", "daily-workers");
    }
    router.push(`${basePath}?${params.toString()}`);
  }

  useEffect(() => {
    setYearDraft(String(year));
    setMonthDraft(month);
    setYearInvalid(false);
  }, [year, month]);

  function applyDraft() {
    const parsed = parseFourDigitYear(yearDraft);
    if (parsed === null) {
      setYearInvalid(true);
      setYearErrorDialogOpen(true);
      return;
    }
    setYearInvalid(false);
    navigate(parsed, monthDraft);
  }

  return (
    <>
      <div className="grid grid-cols-[auto_auto_1fr] grid-rows-[auto_auto] items-start gap-x-3 gap-y-1.5">
        <Label htmlFor="daily-workers-year" className="col-start-1 row-start-1">
          연도
        </Label>
        <Label htmlFor="daily-workers-month" className="col-start-2 row-start-1">
          월
        </Label>
        <span className="col-start-3 row-start-1 block h-5" aria-hidden="true" />

        <Input
          id="daily-workers-year"
          inputMode="numeric"
          className={`col-start-1 row-start-2 ${yearInputClassName}${yearInvalid ? " border-destructive" : ""}`}
          value={yearDraft}
          maxLength={4}
          placeholder="YYYY"
          onChange={(event) => {
            const next = event.target.value.replace(/\D/g, "").slice(0, 4);
            setYearDraft(next);
            if (yearInvalid) setYearInvalid(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
            }
          }}
          aria-invalid={yearInvalid || undefined}
        />

        <select
          id="daily-workers-month"
          className={`col-start-2 row-start-2 ${selectClassName} min-w-20`}
          value={monthDraft}
          onChange={(event) => setMonthDraft(Number(event.target.value))}
        >
          {MONTH_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}월
            </option>
          ))}
        </select>

        <div className="col-start-3 row-start-2 flex items-center gap-2">
          <Button type="button" className="h-8" onClick={applyDraft}>
            적용
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-8"
            onClick={() => navigate(currentYear, currentMonth)}
          >
            이번 달
          </Button>
        </div>
      </div>

      <Dialog open={yearErrorDialogOpen} onOpenChange={setYearErrorDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>연도를 다시 확인해 주세요</DialogTitle>
            <DialogDescription>
              연도는 2000~2100 범위의 4자리 숫자로 입력해 주세요.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setYearErrorDialogOpen(false)}>
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
