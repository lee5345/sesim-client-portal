"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type ConfirmDeleteDialogProps = {
  title: string;
  description: string;
  action: (formData: FormData) => Promise<void>;
  hiddenFields: Record<string, string>;
  triggerLabel: string;
  confirmLabel?: string;
  triggerVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
  triggerSize?: "default" | "xs" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg";
  triggerClassName?: string;
};

export function ConfirmDeleteDialog({
  title,
  description,
  action,
  hiddenFields,
  triggerLabel,
  confirmLabel = "삭제 확인",
  triggerVariant = "destructive",
  triggerSize = "sm",
  triggerClassName,
}: ConfirmDeleteDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant={triggerVariant}
            size={triggerSize}
            className={triggerClassName}
          >
            {triggerLabel}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            취소
          </Button>
          <form
            action={async (formData) => {
              await action(formData);
              setOpen(false);
            }}
          >
            {Object.entries(hiddenFields).map(([name, value]) => (
              <input key={name} type="hidden" name={name} value={value} />
            ))}
            <Button type="submit" variant="destructive">
              {confirmLabel}
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
