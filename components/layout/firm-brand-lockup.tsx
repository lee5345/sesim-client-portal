import { cn } from "@/lib/utils";

type FirmBrandLockupProps = {
  firmName: string;
  firmTagline?: string;
  className?: string;
  showBar?: boolean;
  align?: "start" | "center";
  size?: "default" | "prominent";
};

export function FirmBrandLockup({
  firmName,
  firmTagline,
  className,
  showBar = true,
  align = "start",
  size = "default",
}: FirmBrandLockupProps) {
  const isProminent = size === "prominent";

  return (
    <div
      className={cn(
        "min-w-0",
        align === "center" && "text-center",
        className,
      )}
    >
      <p
        className={cn(
          "font-bold tracking-tight text-sidebar-foreground",
          isProminent
            ? "text-2xl leading-tight sm:text-[2.45rem]"
            : "text-lg leading-tight",
        )}
      >
        {firmName}
      </p>
      {showBar ? (
        <div
          className={cn(
            "h-px w-full rounded-full bg-brand-gold",
            isProminent ? "mt-2" : "mt-1",
          )}
        />
      ) : null}
      {firmTagline ? (
        <p
          className={cn(
            "text-sidebar-muted",
            isProminent
              ? "mt-2.5 text-sm leading-relaxed"
              : "mt-1 text-[11px] leading-snug",
          )}
        >
          {firmTagline}
        </p>
      ) : null}
    </div>
  );
}
