import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type CreateStaffUserFormProps = {
  action: (formData: FormData) => Promise<void>;
};

export function CreateStaffUserForm({ action }: CreateStaffUserFormProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserPlus className="size-4 text-primary" />
          신규 직원 계정
        </CardTitle>
        <CardDescription>
          임시 비밀번호로 계정을 생성합니다. 최초 로그인 시 비밀번호 변경이
          필요합니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                name="name"
                placeholder="홍길동"
                required
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">역할</Label>
              <select
                id="role"
                name="role"
                defaultValue="FIRM_STAFF"
                className={selectClassName}
              >
                <option value="FIRM_STAFF">사무소 직원</option>
                <option value="FIRM_ADMIN">사무소 관리자</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tempPassword">임시 비밀번호</Label>
              <Input
                id="tempPassword"
                name="tempPassword"
                type="password"
                minLength={8}
                placeholder="8자 이상"
                required
                autoComplete="new-password"
              />
            </div>
          </div>
          <div className="flex justify-end border-t pt-4">
            <Button type="submit" size="lg">
              계정 생성
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
