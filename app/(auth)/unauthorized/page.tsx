import Link from "next/link";

import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <AuthShell
      title="접근 권한 없음"
      description="이 페이지에 접근할 권한이 없습니다."
    >
      <div className="flex flex-col gap-3">
        <Button nativeButton={false} render={<Link href="/post-login" />}>
          대시보드로 이동
        </Button>
        <Button
          nativeButton={false}
          variant="outline"
          render={<Link href="/login" />}
        >
          로그인
        </Button>
      </div>
    </AuthShell>
  );
}
