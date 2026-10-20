import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Logo } from "./brand";
import { meQuery } from "@/lib/api/endpoints";
import { isApiConfigured } from "@/lib/api/client";

export function PublicHeader() {
  const { data: me } = useQuery({ ...meQuery(), enabled: isApiConfigured() });
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <Logo suffix="Partners" />
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex" aria-label="Main">
          <a href="/#how" className="hover:text-foreground">How it works</a>
          <a href="/#benefits" className="hover:text-foreground">Benefits</a>
          <a href="/#faq" className="hover:text-foreground">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          {me ? (
            <Button asChild size="sm">
              <Link to="/app">Open portal</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login" search={{ redirect: undefined }}>Sign in</Link>
              </Button>
              <Button asChild size="sm" className="rounded-full">
                <Link to="/signup">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string | undefined; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <div className="mx-auto w-full max-w-6xl px-5 py-5">
        <Logo suffix="Partners" />
      </div>
      <main className="flex flex-1 items-start justify-center px-5 pb-16 pt-6 sm:pt-14">
        <div className="w-full max-w-md rounded-3xl border bg-card p-8 sm:p-10">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
          <div className="mt-7">{children}</div>
        </div>
      </main>
    </div>
  );
}
