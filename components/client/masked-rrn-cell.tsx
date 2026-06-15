"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff } from "lucide-react";

import { revealRRN } from "@/modules/hire-intakes/actions";
import { Button } from "@/components/ui/button";

type MaskedRrnCellProps = {
  id: string;
  maskedRrn: string;
  revealAction?: (id: string) => Promise<{ rrn: string }>;
};

export function MaskedRrnCell({
  id,
  maskedRrn,
  revealAction = revealRRN,
}: MaskedRrnCellProps) {
  const [revealed, setRevealed] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm">{revealed ?? maskedRrn}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={revealed ? "주민등록번호 숨기기" : "주민등록번호 보기"}
        disabled={isPending}
        onClick={() => {
          if (revealed) {
            setRevealed(null);
            return;
          }
          setError(null);
          startTransition(async () => {
            try {
              const result = await revealAction(id);
              setRevealed(result.rrn);
            } catch {
              setError("주민등록번호를 불러오지 못했습니다.");
            }
          });
        }}
      >
        {revealed ? (
          <EyeOff className="size-4" />
        ) : (
          <Eye className="size-4" />
        )}
      </Button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
