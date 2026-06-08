import { requireAuth } from "@/lib/auth/guards";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ClientTerminationsPage() {
  await requireAuth("CLIENT_ADMIN");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">퇴사자 정보</h1>
        <p className="mt-1 text-muted-foreground">
          퇴사자 정보를 등록하고 관리합니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>퇴사자 목록</CardTitle>
          <CardDescription>등록된 퇴사자 정보가 여기에 표시됩니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState message="다음 단계에서 퇴사자 등록 기능이 추가됩니다." />
        </CardContent>
      </Card>
    </div>
  );
}
