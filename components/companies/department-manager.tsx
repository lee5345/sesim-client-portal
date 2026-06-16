import { createDepartmentAction } from "@/modules/companies/departments";
import { DepartmentTags } from "@/components/client/department-tags";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Department = {
  id: string;
  name: string;
};

type DepartmentManagerProps = {
  departments: Department[];
  companyId?: string;
};

export function DepartmentManager({
  departments,
  companyId,
}: DepartmentManagerProps) {
  return (
    <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
      <div>
        <p className="text-sm font-medium">부서 관리</p>
        <p className="text-sm text-muted-foreground">
          입사자 등록 시 선택할 부서 목록을 관리합니다.
        </p>
      </div>

      {departments.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          등록된 부서가 없습니다. 아래에서 새 부서를 추가해 주세요.
        </p>
      ) : (
        <DepartmentTags departments={departments} companyId={companyId} />
      )}

      <form action={createDepartmentAction} className="flex max-w-md gap-2">
        {companyId ? (
          <input type="hidden" name="companyId" value={companyId} />
        ) : null}
        <Input
          name="name"
          placeholder="새 부서 추가"
          required
          maxLength={50}
        />
        <Button type="submit">추가</Button>
      </form>
    </div>
  );
}
