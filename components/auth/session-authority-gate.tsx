"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { validateSessionAuthorityAction } from "@/lib/auth/session-actions";

export function SessionAuthorityGate() {
  const pathname = usePathname();

  useEffect(() => {
    void validateSessionAuthorityAction();
  }, [pathname]);

  useEffect(() => {
    const onFocus = () => {
      void validateSessionAuthorityAction();
    };

    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  return null;
}
