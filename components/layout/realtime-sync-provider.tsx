"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import {
  getRealtimeSyncStateAction,
  type RealtimeSyncState,
} from "@/lib/realtime/sync-actions";
import type { NotificationCounts } from "@/modules/notifications/tenant-changes";

const POLL_INTERVAL_MS = 10_000;

type RealtimeSyncContextValue = {
  notifications: NotificationCounts;
  getNavBadge: (href: string) => number;
  getCompanyBadge: (companyId: string) => number;
  getCompanyModuleBadge: (
    companyId: string,
    entityType: keyof NotificationCounts["companyModuleBadges"][string],
  ) => number;
  refreshNow: () => Promise<void>;
};

const RealtimeSyncContext = createContext<RealtimeSyncContextValue | null>(
  null,
);

export function useRealtimeSync(): RealtimeSyncContextValue {
  const context = useContext(RealtimeSyncContext);
  if (!context) {
    throw new Error("useRealtimeSync must be used within RealtimeSyncProvider");
  }
  return context;
}

export function useOptionalRealtimeSync(): RealtimeSyncContextValue | null {
  return useContext(RealtimeSyncContext);
}

type RealtimeSyncProviderProps = {
  initialState: RealtimeSyncState;
  children: ReactNode;
};

export function RealtimeSyncProvider({
  initialState,
  children,
}: RealtimeSyncProviderProps) {
  const router = useRouter();
  const revisionRef = useRef(initialState.revision);
  const [notifications, setNotifications] = useState(
    initialState.notifications,
  );

  const poll = useCallback(async () => {
    try {
      const nextState = await getRealtimeSyncStateAction();
      setNotifications(nextState.notifications);

      if (nextState.revision !== revisionRef.current) {
        revisionRef.current = nextState.revision;
        router.refresh();
      }
    } catch {
      // Ignore transient polling errors.
    }
  }, [router]);

  useEffect(() => {
    revisionRef.current = initialState.revision;
    setNotifications(initialState.notifications);
  }, [initialState]);

  useEffect(() => {
    const onFocus = () => {
      void poll();
    };

    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [poll]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const startPolling = () => {
      if (intervalId) {
        return;
      }
      intervalId = setInterval(() => {
        void poll();
      }, POLL_INTERVAL_MS);
    };

    const stopPolling = () => {
      if (!intervalId) {
        return;
      }
      clearInterval(intervalId);
      intervalId = undefined;
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void poll();
        startPolling();
      } else {
        stopPolling();
      }
    };

    if (document.visibilityState === "visible") {
      startPolling();
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [poll]);

  const value = useMemo<RealtimeSyncContextValue>(
    () => ({
      notifications,
      getNavBadge: (href: string) => notifications.navBadges[href] ?? 0,
      getCompanyBadge: (companyId: string) =>
        notifications.companyBadges[companyId] ?? 0,
      getCompanyModuleBadge: (companyId, entityType) =>
        notifications.companyModuleBadges[companyId]?.[entityType] ?? 0,
      refreshNow: poll,
    }),
    [notifications, poll],
  );

  return (
    <RealtimeSyncContext.Provider value={value}>
      {children}
    </RealtimeSyncContext.Provider>
  );
}
