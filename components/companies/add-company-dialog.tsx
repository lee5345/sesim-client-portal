"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";

import { createCompanyAction } from "@/modules/companies/companies";
import { BusinessNumberInput } from "@/components/companies/business-number-input";
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

export function AddCompanyDialog() {
  const [open, setOpen] = useState(false);
  const [businessNumber, setBusinessNumber] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function resetState() {
    setBusinessNumber("");
    setFormError(null);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          resetState();
        }
      }}
    >
      <DialogTrigger
        render={
          <Button>
            <Plus className="size-4" />
            고객사 추가
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>고객사 추가</DialogTitle>
          <DialogDescription>
            새 고객사를 등록합니다. 사업자등록번호는 선택 사항입니다.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            setFormError(null);

            const formData = new FormData(event.currentTarget);
            startTransition(async () => {
              const result = await createCompanyAction(formData);
              if (!result.success) {
                setFormError(result.error);
                return;
              }

              setOpen(false);
              resetState();
            });
          }}
        >
          {formError ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="name">회사명</Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="회사명 입력"
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label>사업자등록번호 (선택)</Label>
            <BusinessNumberInput
              idPrefix="add-company-business-number"
              name="businessNumber"
              value={businessNumber}
              onChange={setBusinessNumber}
              disabled={isPending}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              취소
            </Button>
            <Button type="submit" disabled={isPending}>
              추가
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
