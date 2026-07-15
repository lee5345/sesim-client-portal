"use client";

import { useState } from "react";

import { DELETE_CONFIRMATION_PHRASE } from "@/lib/validation/delete-confirmation";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ConfirmDeleteDialogProps = {
  title: string;
  description: string;
  action: (formData: FormData) => Promise<void>;
  hiddenFields: Record<string, string>;
  triggerLabel: string;
  confirmLabel?: string;
  requireTypedConfirmation?: boolean;
  triggerVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
  triggerSize?: "default" | "xs" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg";
  triggerClassName?: string;
  disabled?: boolean;
};

export function ConfirmDeleteDialog({
  title,
  description,
  action,
  hiddenFields,
  triggerLabel,
  confirmLabel = "삭제 확인",
  requireTypedConfirmation = false,
  triggerVariant = "destructive",
  triggerSize = "sm",
  triggerClassName,
  disabled = false,
}: ConfirmDeleteDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"confirm" | "type">("confirm");
  const [typedConfirmation, setTypedConfirmation] = useState("");

  const resetDialog = () => {
    setStep("confirm");
    setTypedConfirmation("");
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      resetDialog();
    }
  };

  const canSubmitTypedConfirmation =
    typedConfirmation.trim() === DELETE_CONFIRMATION_PHRASE;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        disabled={disabled}
        render={
          <Button
            type="button"
            variant={triggerVariant}
            size={triggerSize}
            className={triggerClassName}
            disabled={disabled}
          >
            {triggerLabel}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {step === "confirm"
              ? description
              : `계속하려면 아래에 "${DELETE_CONFIRMATION_PHRASE}"을(를) 입력하세요.`}
          </DialogDescription>
        </DialogHeader>

        {step === "type" ? (
          <div className="space-y-2">
            <Label htmlFor="delete-confirmation-input">삭제 확인</Label>
            <Input
              id="delete-confirmation-input"
              value={typedConfirmation}
              onChange={(event) => setTypedConfirmation(event.target.value)}
              placeholder={DELETE_CONFIRMATION_PHRASE}
              autoComplete="off"
            />
          </div>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            취소
          </Button>
          {step === "confirm" && requireTypedConfirmation ? (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setStep("type")}
            >
              {confirmLabel}
            </Button>
          ) : (
            <form
              action={async (formData) => {
                await action(formData);
                handleOpenChange(false);
              }}
            >
              {Object.entries(hiddenFields).map(([name, value]) => (
                <input key={name} type="hidden" name={name} value={value} />
              ))}
              {requireTypedConfirmation ? (
                <input
                  type="hidden"
                  name="deleteConfirmation"
                  value={typedConfirmation}
                />
              ) : null}
              <Button
                type="submit"
                variant="destructive"
                disabled={requireTypedConfirmation && !canSubmitTypedConfirmation}
              >
                {requireTypedConfirmation ? "삭제" : confirmLabel}
              </Button>
            </form>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
