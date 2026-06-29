"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { Eye, EyeOff } from "lucide-react";

import { revealRRN } from "@/modules/hire-intakes/actions";
import { Button } from "@/components/ui/button";

type RevealRrnFn = (
  id: string,
  companyId?: string | null,
) => Promise<{ rrn: string }>;

type MaskedRrnEntry = {
  id: string;
};

type MaskedRrnContextValue = {
  revealedById: Record<string, string> | null;
  isPending: boolean;
  error: string | null;
  toggleReveal: () => void;
};

const MaskedRrnContext = createContext<MaskedRrnContextValue | null>(null);

function useMaskedRrnContext() {
  const context = useContext(MaskedRrnContext);
  if (!context) {
    throw new Error("MaskedRrn components must be used within MaskedRrnProvider");
  }
  return context;
}

type MaskedRrnProviderProps = {
  entries: MaskedRrnEntry[];
  companyId?: string;
  revealFn?: RevealRrnFn;
  children: ReactNode;
};

export function MaskedRrnProvider({
  entries,
  companyId,
  revealFn = revealRRN,
  children,
}: MaskedRrnProviderProps) {
  const [revealedById, setRevealedById] = useState<Record<string, string> | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const entryIds = entries.map((entry) => entry.id).join(",");

  useEffect(() => {
    setRevealedById(null);
    setError(null);
  }, [entryIds]);

  function toggleReveal() {
    if (revealedById) {
      setRevealedById(null);
      setError(null);
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const results = await Promise.all(
          entries.map(async (entry) => {
            const result = await revealFn(entry.id, companyId);
            return [entry.id, result.rrn] as const;
          }),
        );
        setRevealedById(Object.fromEntries(results));
      } catch {
        setRevealedById(null);
        setError("주민등록번호를 불러오지 못했습니다.");
      }
    });
  }

  return (
    <MaskedRrnContext.Provider
      value={{ revealedById, isPending, error, toggleReveal }}
    >
      {children}
    </MaskedRrnContext.Provider>
  );
}

export function MaskedRrnColumnHeader() {
  const { revealedById, isPending, error, toggleReveal } = useMaskedRrnContext();
  const isRevealed = revealedById !== null;

  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      <span>주민등록번호</span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={isRevealed ? "주민등록번호 숨기기" : "주민등록번호 보기"}
        disabled={isPending}
        onClick={toggleReveal}
      >
        {isRevealed ? (
          <EyeOff className="size-4" />
        ) : (
          <Eye className="size-4" />
        )}
      </Button>
      {error ? <span className="text-xs font-normal text-destructive">{error}</span> : null}
    </div>
  );
}

type MaskedRrnCellProps = {
  id: string;
  maskedRrn: string;
};

export function MaskedRrnCell({ id, maskedRrn }: MaskedRrnCellProps) {
  const { revealedById } = useMaskedRrnContext();

  return (
    <span className="font-mono text-sm">{revealedById?.[id] ?? maskedRrn}</span>
  );
}
