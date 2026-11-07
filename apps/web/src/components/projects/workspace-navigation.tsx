"use client";

import { useRouter } from "next/navigation";
import {
  Code2,
  FolderKanban,
  LogOut,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WorkspaceSection } from "@/lib/project";

type NavigationItem = {
  id: WorkspaceSection;
  label: string;
  icon: LucideIcon;
};

const navigationItems: NavigationItem[] = [
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "rooms", label: "Rooms", icon: UsersRound },
  { id: "profile", label: "Profile", icon: UserRound },
];

export function WorkspaceNavigation({
  activeSection,
  onNavigate,
}: {
  activeSection: WorkspaceSection;
  onNavigate: (section: WorkspaceSection) => void;
}) {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/auth/login");
          router.refresh();
        },
      },
    });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <a
          href="#projects"
          onClick={() => onNavigate("projects")}
          className="group flex shrink-0 items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_6px_20px_-8px_var(--primary)]">
            <Code2 aria-hidden="true" className="size-4" strokeWidth={2.2} />
          </span>
          <span className="text-lg font-semibold tracking-tight">codiooo</span>
        </a>

        <nav
          aria-label="Primary navigation"
          className="flex items-center gap-0.5 sm:gap-1"
        >
          {navigationItems.map(({ id, label, icon: Icon }) => {
            const isActive = activeSection === id;

            return (
              <a
                key={id}
                href={`#${id}`}
                onClick={() => onNavigate(id)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-lg px-2 text-xs font-medium transition-colors sm:px-3 sm:text-sm",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon aria-hidden="true" className="hidden size-4 sm:block" />
                {label}
              </a>
            );
          })}

          {session?.user ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="ml-1"
              aria-label="Sign out"
            >
              <LogOut aria-hidden="true" className="size-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
