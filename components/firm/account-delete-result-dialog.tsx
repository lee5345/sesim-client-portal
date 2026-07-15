"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type AccountDeleteResultDialogProps = {
  accountLabel?: string;
};

export function AccountDeleteResultDialog({
  accountLabel = "계정",
}: AccountDeleteResultDialogProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const result = searchParams.get("accountResult");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (result === "deleted" || result === "deactivated") {
      setOpen(true);
    }
  }, [result]);

  const clearResultParam = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("accountResult");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      clearResultParam();
    }
  };

  if (result !== "deleted" && result !== "deactivated") {
    return null;
  }

  const deactivated = result === "deactivated";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {deactivated ? "삭제 불가" : "삭제 완료"}
          </DialogTitle>
          <DialogDescription>
            {deactivated
              ? `본 ${accountLabel}에 의한 활동 기록이 있어 삭제할 수 없습니다. 대신 비활성 상태로 전환되었습니다.`
              : `성공적으로 삭제되었습니다.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" onClick={() => handleOpenChange(false)}>
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
