import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { EmptyState, ErrorState, LoadingState, PageHeader, Pager } from "@/components/ui-kit";
import { admin } from "@/lib/api/endpoints";

export const Route = createFileRoute("/admin/audit")({
  validateSearch: (s: Record<string, unknown>) => ({ page: Math.max(0, Number(s["page"]) || 0) }),
  head: () => ({
    meta: [
      { title: "Audit history — SortedDate Review" },
      { name: "description", content: "Every reviewed change across the platform." },
      { property: "og:title", content: "Audit history — SortedDate Review" },
      { property: "og:description", content: "Platform audit history." },
    ],
  }),
  component: Audit,
});

function Audit() {
  const { page } = Route.useSearch();
  const navigate = Route.useNavigate();
  const q = useQuery({ queryKey: ["admin", "audit", page], queryFn: () => admin.audit(page), placeholderData: keepPreviousData });
  return (
    <>
      <PageHeader title="Audit history" description="A permanent record of actions across the platform." />
      {q.isLoading ? <LoadingState /> : q.error ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : q.data!.content.length === 0 ? (
        <EmptyState title="No events yet" />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-muted-foreground">
                <tr><th className="px-5 py-3 font-medium">When</th><th className="px-5 py-3 font-medium">Actor</th><th className="px-5 py-3 font-medium">Action</th><th className="px-5 py-3 font-medium">Entity</th></tr>
              </thead>
              <tbody className="divide-y">
                {q.data!.content.map((e) => (
                  <tr key={e.id}>
                    <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">{new Date(e.occurredAt).toLocaleString()}</td>
                    <td className="px-5 py-3">{e.actorEmail ?? "System"}</td>
                    <td className="px-5 py-3 font-medium">{e.action}</td>
                    <td className="px-5 py-3 text-muted-foreground">{e.entityType} · <span className="font-mono text-xs">{e.entityId.slice(0, 8)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={page} totalPages={q.data!.totalPages} onPage={(p) => navigate({ search: { page: p } })} />
        </>
      )}
    </>
  );
}
