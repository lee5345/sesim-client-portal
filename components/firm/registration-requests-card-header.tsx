"use client";

import { ClipboardList } from "lucide-react";

import { NotificationCountBadge } from "@/components/layout/notification-count-badge";
import { useRealtimeSync } from "@/components/layout/realtime-sync-provider";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function RegistrationRequestsCardHeader() {
  const { notifications } = useRealtimeSync();
  const count = notifications.registrationRequests;

  return (
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-base">
        <ClipboardList className="size-4 text-primary" />
        대기 중인 신청
        <NotificationCountBadge count={count} variant="registration" />
      </CardTitle>
      <CardDescription>
        고객사 관리자 가입 신청을 검토하고 승인 또는 거절합니다.
      </CardDescription>
    </CardHeader>
  );
}
