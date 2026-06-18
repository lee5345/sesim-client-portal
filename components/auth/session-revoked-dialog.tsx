"use client";

import { useEffect, useState } from "react";

import {
  getSessionRevokeMessage,
  isSessionRevokeReason,
} from "@/lib/auth/session-revoke-reasons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type SessionRevokedDialogProps = {
  revoked?: string;
};

export function SessionRevokedDialog({ revoked }: SessionRevokedDialogProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isSessionRevokeReason(revoked)) {
      setOpen(true);
    }
  }, [revoked]);

  if (!isSessionRevokeReason(revoked)) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>세션이 종료되었습니다</DialogTitle>
          <DialogDescription>{getSessionRevokeMessage(revoked)}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" onClick={() => setOpen(false)}>
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
