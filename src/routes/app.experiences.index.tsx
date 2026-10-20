import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from "@/components/ui-kit";
import { useMe } from "@/components/app-shell";
import { experiencesQuery } from "@/lib/api/endpoints";
import { can, formatMoney, merchantRoleOf } from "@/lib/lifecycle";
import type { ExperienceStatus } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/experiences/")({
  head: () => ({
    meta: [
      { title: "Experiences — SortedDate Partners" },
      { name: "description", content: "Create and manage your dining experiences." },
      { property: "og:title", content: "Experiences — SortedDate Partners" },
      { property: "og:description", content: "Create and manage your dining experiences." },
    ],
  }),
  component: ExperiencesList,
});

const FILTERS: (ExperienceStatus | "ALL")[] = ["ALL", "DRAFT", "SUBMITTED", "APPROVED", "PUBLISHED", "PAUSED", "REJECTED", "ARCHIVED"];

function ExperiencesList() {
  const { data: me } = useMe();
  const canManage = can(merchantRoleOf(me?.roles ?? []), "experiences:manage");
  const q = useQuery(experiencesQuery());
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("ALL");
  const list = (q.data?.content ?? []).filter((e) => filter === "ALL" || e.status === filter);

  return (
    <>
      <PageHeader
        title="Experiences"
        description="The prepaid moments guests can buy at your restaurant."
        actions={canManage && <Button asChild className="rounded-full"><Link to="/app/experiences/new"><Plus className="size-4" /> New experience</Link></Button>}
      />
      <div className="mb-6 flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Filter by status">
        {FILTERS.map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={cn("shrink-0 rounded-full px-3.5 py-1.5 text-sm transition-colors", filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}
          >
            {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>
      {q.isLoading ? (
        <LoadingState />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState icon={<Sparkles className="size-5" />} title={filter === "ALL" ? "No experiences yet" : "Nothing here"} description="Create a coffee date, brunch package or fixed-price dinner." action={canManage && filter === "ALL" && <Button asChild><Link to="/app/experiences/new">Create experience</Link></Button>} />
      ) : (
        <ul className="divide-y rounded-2xl border bg-card">
          {list.map((e) => (
            <li key={e.id}>
              <Link to="/app/experiences/$experienceId" params={{ experienceId: e.id }} className="flex items-center gap-4 px-6 py-5 transition-colors hover:bg-surface">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{e.title}</p>
                  <p className="text-sm text-muted-foreground">{e.category} · {e.venueIds?.length ?? 0} location(s)</p>
                </div>
                <span className="hidden text-sm tabular-nums sm:block">{formatMoney(e.price.amountMinor, e.price.currency)}</span>
                <StatusBadge status={e.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
