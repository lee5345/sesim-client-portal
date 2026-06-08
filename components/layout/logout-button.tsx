import { LogOut } from "lucide-react";

import { logoutAction } from "@/lib/auth/logout";
import { Button } from "@/components/ui/button";

type LogoutButtonProps = {
  variant?: "sidebar" | "default";
};

export function LogoutButton({ variant = "default" }: LogoutButtonProps) {
  if (variant === "sidebar") {
    return (
      <form action={logoutAction}>
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <LogOut className="size-4" />
          로그아웃
        </Button>
      </form>
    );
  }

  return (
    <form action={logoutAction}>
      <Button type="submit" variant="outline" size="sm">
        로그아웃
      </Button>
    </form>
  );
}
