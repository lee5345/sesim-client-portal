import { requireAuth } from "@/lib/auth/guards";
import {
  createDepartmentAction,
  deleteDepartmentAction,
  listDepartments,
} from "@/modules/companies/departments";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function ClientSettingsPage() {
  const session = await requireAuth("CLIENT_ADMIN");
  const companyId = session.user.companyId;

  if (!companyId) {
    return <p className="text-muted-foreground">소속 회사 정보가 없습니다.</p>;
  }

  const departments = await listDepartments(companyId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">설정</h1>
        <p className="mt-1 text-muted-foreground">
          회사 정보 및 부서를 관리합니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>부서 관리</CardTitle>
          <CardDescription>
            입사자 등록 시 선택할 부서 목록을 관리합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {departments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              등록된 부서가 없습니다. 아래에서 새 부서를 추가해 주세요.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {departments.map((dept) => (
                <div
                  key={dept.id}
                  className="flex items-center gap-1 rounded-full border bg-muted/40 pl-3 pr-1 py-1 text-sm"
                >
                  <span>{dept.name}</span>
                  <form action={deleteDepartmentAction}>
                    <input type="hidden" name="id" value={dept.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="xs"
                      className="h-6 text-muted-foreground hover:text-destructive"
                    >
                      삭제
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          )}

          <form action={createDepartmentAction} className="flex max-w-md gap-2">
            <Input
              name="name"
              placeholder="새 부서 추가"
              required
              maxLength={50}
            />
            <Button type="submit">추가</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
