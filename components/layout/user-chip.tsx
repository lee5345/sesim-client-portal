import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogoutButton } from "@/components/layout/logout-button";

type UserChipProps = {
  name: string;
  roleLabel: string;
  avatarText: string;
};

export function UserChip({ name, roleLabel, avatarText }: UserChipProps) {
  return (
    <div className="border-t border-sidebar-border px-4 py-4">
      <div className="mb-3 flex items-center gap-3">
        <Avatar className="size-9 border border-sidebar-border bg-sidebar-accent">
          <AvatarFallback className="bg-sidebar-accent text-sm font-medium text-sidebar-foreground">
            {avatarText}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-sidebar-foreground">
            {name}
          </p>
          <p className="truncate text-xs text-sidebar-muted">{roleLabel}</p>
        </div>
      </div>
      <LogoutButton variant="sidebar" />
    </div>
  );
}
