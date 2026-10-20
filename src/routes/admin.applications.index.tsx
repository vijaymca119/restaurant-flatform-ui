import { createFileRoute, Link } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { EmptyState, ErrorState, LoadingState, PageHeader, Pager, StatusBadge } from "@/components/ui-kit";
import { admin } from "@/lib/api/endpoints";
import { countryName } from "@/lib/reference";
import { cn } from "@/lib/utils";

const STATUSES = ["SUBMITTED", "APPROVED", "REJECTED", "DRAFT"] as const;

export const Route = createFileRoute("/admin/applications/")({
  validateSearch: (s: Record<string, unknown>) => ({
    status: STATUSES.includes(s["status"] as never) ? (s["status"] as string) : "SUBMITTED",
    page: Math.max(0, Number(s["page"]) || 0),
  }),
  head: () => ({
    meta: [
      { title: "Merchant applications — SortedDate Review" },
      { name: "description", content: "Review merchant applications." },
      { property: "og:title", content: "Merchant applications — SortedDate Review" },
      { property: "og:description", content: "Review merchant applications." },
    ],
  }),
  component: Applications,
});

function Applications() {
  const { status, page } = Route.useSearch();
  const navigate = Route.useNavigate();
  const q = useQuery({ queryKey: ["admin", "applications", status, page], queryFn: () => admin.applications(status, page), placeholderData: keepPreviousData });
  return (
    <>
      <PageHeader title="Merchant applications" description="Verify businesses before they can sell." />
      <div className="mb-6 flex gap-1.5 overflow-x-auto">
        {STATUSES.map((s) => (
          <button key={s} onClick={() => navigate({ search: { status: s, page: 0 } })} aria-pressed={status === s}
            className={cn("rounded-full px-3.5 py-1.5 text-sm", status === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>
      {q.isLoading ? <LoadingState /> : q.error ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : q.data!.content.length === 0 ? (
        <EmptyState title="Queue is clear" description="No applications with this status." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-muted-foreground">
                <tr><th className="px-5 py-3 font-medium">Business</th><th className="px-5 py-3 font-medium">Country</th><th className="px-5 py-3 font-medium">Submitted</th><th className="px-5 py-3 font-medium">Status</th></tr>
              </thead>
              <tbody className="divide-y">
                {q.data!.content.map((a) => (
                  <tr key={a.id} className="hover:bg-surface">
                    <td className="px-5 py-4"><Link to="/admin/applications/$applicationId" params={{ applicationId: a.id }} className="font-medium hover:text-info">{a.legalName ?? "Unnamed"}</Link><p className="text-muted-foreground">{a.tradingName}</p></td>
                    <td className="px-5 py-4">{countryName(a.country)}</td>
                    <td className="px-5 py-4 text-muted-foreground">{a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : "—"}</td>
                    <td className="px-5 py-4"><StatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={page} totalPages={q.data!.totalPages} onPage={(p) => navigate({ search: { status, page: p } })} />
        </>
      )}
    </>
  );
}
