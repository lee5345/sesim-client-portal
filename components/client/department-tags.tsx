"use client";

import { deleteDepartmentAction } from "@/modules/companies/departments";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";

type Department = {
  id: string;
  name: string;
};

type DepartmentTagsProps = {
  departments: Department[];
  companyId?: string;
};

export function DepartmentTags({ departments, companyId }: DepartmentTagsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {departments.map((dept) => (
        <div
          key={dept.id}
          className="flex items-center gap-1 rounded-full border bg-muted/40 py-1 pl-3 pr-1 text-sm"
        >
          <span>{dept.name}</span>
          <ConfirmDeleteDialog
            title="부서 삭제"
            description={`"${dept.name}" 부서를 삭제하시겠습니까?`}
            action={deleteDepartmentAction}
            hiddenFields={{
              id: dept.id,
              ...(companyId ? { companyId } : {}),
            }}
            triggerLabel="삭제"
            triggerVariant="ghost"
            triggerSize="xs"
            triggerClassName="h-6 text-muted-foreground hover:text-destructive"
          />
        </div>
      ))}
    </div>
  );
}
