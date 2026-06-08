import type { ReactNode } from "react";

import { FirmBrandLockup } from "@/components/layout/firm-brand-lockup";
import { getFirmName, getFirmTagline } from "@/lib/config/branding";

type AuthShellProps = {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  const firmName = getFirmName();
  const firmTagline = getFirmTagline();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="relative overflow-hidden border-b border-sidebar-border bg-gradient-to-br from-sidebar via-[oklch(0.28_0.06_252)] to-[oklch(0.22_0.055_252)] px-6 py-12 shadow-md sm:py-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(ellipse 70% 80% at 50% 0%, var(--brand-gold) 0%, transparent 65%)",
          }}
        />
        <div className="relative mx-auto w-full max-w-md py-2 text-center">
          <FirmBrandLockup
            firmName={firmName}
            firmTagline={firmTagline}
            showBar={false}
            align="center"
            size="prominent"
          />
        </div>
      </header>

      <main className="portal-main flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-1 text-center">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {description ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-sm ring-1 ring-foreground/5">
            {children}
          </div>

          {footer ? (
            <div className="text-center text-sm text-muted-foreground">
              {footer}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
