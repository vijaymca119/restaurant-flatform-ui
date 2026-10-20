import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import type { LinkProps } from "@tanstack/react-router";
import { LogOut, PlugZap } from "lucide-react";
import { Logo } from "./brand";
import { Button } from "@/components/ui/button";
import { auth, meQuery } from "@/lib/api/endpoints";
import { isApiConfigured } from "@/lib/api/client";

export interface NavItem {
  to: NonNullable<LinkProps["to"]>;
  label: string;
  icon: LucideIcon;
  exact?: boolean | undefined;
}

export function useMe() {
  return useQuery({ ...meQuery(), enabled: isApiConfigured() });
}

export function AppShell({ nav, suffix, children }: { nav: NavItem[]; suffix: string; children: ReactNode }) {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function signOut() {
    await qc.cancelQueries();
    try {
      await auth.logout();
    } catch {
      /* session may already be gone */
    }
    qc.clear();
    navigate({ to: "/login", search: { redirect: undefined }, replace: true });
  }

  const links = nav.map((n) => (
    <Link
      key={n.to}
      to={n.to}
      activeOptions={n.exact ? { exact: true } : {}}
      className="flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground data-[status=active]:bg-sidebar-accent data-[status=active]:font-medium data-[status=active]:text-foreground"
    >
      <n.icon className="size-4" aria-hidden />
      {n.label}
    </Link>
  ));

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="hidden border-r bg-sidebar lg:flex lg:min-h-screen lg:flex-col lg:p-4">
        <div className="px-2 py-2">
          <Logo suffix={suffix} />
        </div>
        <nav className="mt-6 flex flex-col gap-0.5" aria-label="Portal">{links}</nav>
        <div className="mt-auto border-t pt-4">
          {me && (
            <div className="mb-2 px-2">
              <p className="truncate text-sm font-medium">{me.displayName ?? me.email}</p>
              <p className="truncate text-xs text-muted-foreground">{me.email}</p>
            </div>
          )}
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={signOut}>
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur-xl lg:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <Logo suffix={suffix} />
            <Button variant="ghost" size="sm" onClick={signOut} aria-label="Sign out">
              <LogOut className="size-4" />
            </Button>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-2" aria-label="Portal">{links}</nav>
        </header>
        {!isApiConfigured() && (
          <div className="flex items-center gap-2 border-b bg-warning-soft px-6 py-2.5 text-sm text-warning">
            <PlugZap className="size-4 shrink-0" aria-hidden />
            Preview mode: the partner API isn't connected, so no live data is shown.
          </div>
        )}
        <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
