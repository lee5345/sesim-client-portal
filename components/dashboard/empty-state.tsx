import { cn } from "@/lib/utils";

type EmptyStateProps = {
  message: string;
  className?: string;
};

export function EmptyState({ message, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 px-6 py-12 text-center",
        className,
      )}
    >
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
