"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";

import { createCompanyAction } from "@/modules/companies/companies";
import { WorkplaceManagementNumberInput } from "@/components/companies/workplace-management-number-input";
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
import { FieldLabel } from "@/components/ui/field-label";
import { Input } from "@/components/ui/input";
import { EMPTY_FIELD_LABEL } from "@/lib/companies/labels";

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type AddCompanyDialogProps = {
  staffUsers: { id: string; name: string; isActive: boolean }[];
};

export function AddCompanyDialog({ staffUsers }: AddCompanyDialogProps) {
  const [open, setOpen] = useState(false);
  const [workplaceManagementNumber, setWorkplaceManagementNumber] = useState("");
  const [firmContactName, setFirmContactName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function resetState() {
    setWorkplaceManagementNumber("");
    setFirmContactName("");
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
          <DialogDescription>새 고객사를 등록합니다.</DialogDescription>
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
          <input type="hidden" name="firmContactName" value={firmContactName} />
          <div className="space-y-2">
            <FieldLabel htmlFor="name" required>
              회사명
            </FieldLabel>
            <Input
              id="name"
              name="name"
              required
              placeholder="회사명 입력"
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <FieldLabel>사업장관리번호</FieldLabel>
            <WorkplaceManagementNumberInput
              idPrefix="add-company-workplace-management-number"
              name="workplaceManagementNumber"
              value={workplaceManagementNumber}
              onChange={setWorkplaceManagementNumber}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <FieldLabel htmlFor="firmContactName">담당 직원</FieldLabel>
            <select
              id="firmContactName"
              value={firmContactName}
              onChange={(event) => setFirmContactName(event.target.value)}
              className={selectClassName}
              disabled={isPending}
            >
              <option value="">{EMPTY_FIELD_LABEL}</option>
              {staffUsers
                .filter((user) => user.isActive)
                .map((user) => (
                  <option key={user.id} value={user.name}>
                    {user.name}
                  </option>
                ))}
            </select>
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
