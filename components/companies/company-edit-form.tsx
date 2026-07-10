"use client";

import { useEffect, useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  deleteCompanyAction,
  updateCompanyAction,
} from "@/modules/companies/companies";
import { WorkplaceManagementNumberInput } from "@/components/companies/workplace-management-number-input";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
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
import { formatWorkplaceManagementNumber } from "@/lib/format/workplace-management-number";
import { EMPTY_FIELD_LABEL } from "@/lib/companies/labels";

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type CompanyEditFormProps = {
  company: {
    id: string;
    name: string;
    workplaceManagementNumber: string | null;
    firmContactName: string | null;
    isActive: boolean;
  };
  staffUsers: { id: string; name: string; isActive: boolean }[];
  canDelete: boolean;
};

export function CompanyEditForm({
  company,
  staffUsers,
  canDelete,
}: CompanyEditFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isActive, setIsActive] = useState(company.isActive ? "true" : "false");
  const [workplaceManagementNumber, setWorkplaceManagementNumber] = useState(
    formatWorkplaceManagementNumber(company.workplaceManagementNumber) ?? "",
  );
  const [firmContactName, setFirmContactName] = useState(
    company.firmContactName ?? "",
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formId = `company-edit-form-${company.id}`;

  useEffect(() => {
    if (!open) {
      return;
    }

    setIsActive(company.isActive ? "true" : "false");
    setWorkplaceManagementNumber(
      formatWorkplaceManagementNumber(company.workplaceManagementNumber) ?? "",
    );
    setFirmContactName(company.firmContactName ?? "");
    setFormError(null);
  }, [open, company.workplaceManagementNumber, company.firmContactName, company.isActive]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="icon-sm" aria-label="고객사 정보 수정">
            <Pencil className="size-4" />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>고객사 정보</DialogTitle>
          <DialogDescription>
            회사명, 사업장관리번호, 사무실 담당자, 운영 상태를 수정합니다.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          id={formId}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            setFormError(null);

            const formData = new FormData(event.currentTarget);
            startTransition(async () => {
              const result = await updateCompanyAction(formData);
              if (!result.success) {
                setFormError(result.error);
                return;
              }

              setOpen(false);
              router.refresh();
            });
          }}
        >
          {formError ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          ) : null}
          <input type="hidden" name="companyId" value={company.id} />
          <input type="hidden" name="isActive" value={isActive} />
          <input type="hidden" name="firmContactName" value={firmContactName} />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`name-${company.id}`}>회사명</Label>
              <Input
                id={`name-${company.id}`}
                name="name"
                defaultValue={company.name}
                required
                maxLength={100}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`firmContactName-${company.id}`}>담당 직원</Label>
              <select
                id={`firmContactName-${company.id}`}
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
            <div className="space-y-2">
              <Label>사업장관리번호</Label>
              <WorkplaceManagementNumberInput
                idPrefix={`workplaceManagementNumber-${company.id}`}
                name="workplaceManagementNumber"
                value={workplaceManagementNumber}
                onChange={setWorkplaceManagementNumber}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`isActive-${company.id}`}>운영 상태</Label>
              <select
                id={`isActive-${company.id}`}
                value={isActive}
                onChange={(event) => setIsActive(event.target.value)}
                className={selectClassName}
                disabled={isPending}
              >
                <option value="true">활성</option>
                <option value="false">비활성</option>
              </select>
            </div>
          </div>
        </form>

        {canDelete ? (
          <div className="border-t pt-4">
            <p className="mb-3 text-sm text-muted-foreground">
              고객사를 삭제하면 연결된 입사·퇴사·급여 데이터와 클라이언트 계정이
              모두 영구 삭제되며 복구할 수 없습니다.
            </p>
            <ConfirmDeleteDialog
              title="고객사 삭제"
              description={`"${company.name}" 고객사를 삭제하시겠습니까? 연결된 모든 데이터가 영구 삭제되며 복구할 수 없습니다.`}
              action={deleteCompanyAction}
              hiddenFields={{ companyId: company.id }}
              triggerLabel="고객사 삭제"
              confirmLabel="삭제 확인"
              requireTypedConfirmation
            />
          </div>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            취소
          </Button>
          <Button type="submit" form={formId} disabled={isPending}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
