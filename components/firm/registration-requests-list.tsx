import { CheckCircle2 } from "lucide-react";

import { RegistrationRequestsCardHeader } from "@/components/firm/registration-requests-card-header";

import { EMPTY_FIELD_LABEL } from "@/lib/companies/labels";
import { formatDate } from "@/lib/format/date";
import { formatPhone } from "@/lib/format/phone";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type RegistrationRequest = {
  id: string;
  name: string;
  email: string;
  companyName: string;
  phone: string | null;
  note: string | null;
  createdAt: Date;
};

type Company = {
  id: string;
  name: string;
};

type RegistrationRequestsListProps = {
  requests: RegistrationRequest[];
  companies: Company[];
  approveAction: (formData: FormData) => Promise<void>;
  rejectAction: (formData: FormData) => Promise<void>;
};

export function RegistrationRequestsList({
  requests,
  companies,
  approveAction,
  rejectAction,
}: RegistrationRequestsListProps) {
  return (
    <Card className="shadow-sm">
      <RegistrationRequestsCardHeader />
      <CardContent>
        {requests.length === 0 ? (
          <EmptyState message="대기 중인 가입 신청이 없습니다." />
        ) : (
          <div className="space-y-6">
            {requests.map((request, index) => (
              <div key={request.id}>
                {index > 0 ? <Separator className="mb-6" /> : null}
                <div className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{request.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {request.email}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(request.createdAt)} 신청
                    </p>
                  </div>

                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-muted-foreground">회사명</dt>
                      <dd className="mt-0.5 font-medium">
                        {request.companyName}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">전화번호</dt>
                      <dd className="mt-0.5">
                        {request.phone?.trim()
                          ? formatPhone(request.phone)
                          : EMPTY_FIELD_LABEL}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-muted-foreground">비고</dt>
                      <dd className="mt-0.5 whitespace-pre-wrap">
                        {request.note?.trim()
                          ? request.note
                          : EMPTY_FIELD_LABEL}
                      </dd>
                    </div>
                  </dl>

                  <form
                    action={approveAction}
                    className="rounded-lg border bg-muted/30 p-4"
                  >
                    <input type="hidden" name="requestId" value={request.id} />
                    <p className="mb-3 flex items-center gap-1.5 text-sm font-medium">
                      <CheckCircle2 className="size-4 text-primary" />
                      승인 처리
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`company-${request.id}`}>
                          기존 고객사 연결
                        </Label>
                        <select
                          id={`company-${request.id}`}
                          name="companyId"
                          defaultValue=""
                          className={selectClassName}
                        >
                          <option value="">선택하지 않음</option>
                          {companies.map((company) => (
                            <option key={company.id} value={company.id}>
                              {company.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`new-company-${request.id}`}>
                          또는 신규 고객사 생성
                        </Label>
                        <Input
                          id={`new-company-${request.id}`}
                          name="newCompanyName"
                          placeholder="새 고객사명 입력"
                        />
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      기존 고객사를 선택하거나, 신규 고객사명 중 하나를
                      입력해 주세요.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button type="submit">승인</Button>
                      <ConfirmDeleteDialog
                        title="가입 신청 거절"
                        description={`"${request.name}" (${request.email})의 가입 신청을 거절하시겠습니까?`}
                        action={rejectAction}
                        hiddenFields={{ requestId: request.id }}
                        triggerLabel="거절"
                        confirmLabel="거절 확인"
                        triggerSize="default"
                      />
                    </div>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
