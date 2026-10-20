import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState, PageHeader, Pager, StatusBadge } from "@/components/ui-kit";
import { RejectDialog } from "@/components/reject-dialog";
import { admin } from "@/lib/api/endpoints";
import { errorMessage } from "@/lib/api/client";
import { formatMoney } from "@/lib/lifecycle";
import { cn } from "@/lib/utils";

const STATUSES = ["SUBMITTED", "APPROVED", "PUBLISHED", "REJECTED"] as const;

export const Route = createFileRoute("/admin/experiences")({
  validateSearch: (s: Record<string, unknown>) => ({
    status: STATUSES.includes(s["status"] as never) ? (s["status"] as string) : "SUBMITTED",
    page: Math.max(0, Number(s["page"]) || 0),
  }),
  head: () => ({
    meta: [
      { title: "Experience moderation — SortedDate Review" },
      { name: "description", content: "Approve or reject submitted experiences." },
      { property: "og:title", content: "Experience moderation — SortedDate Review" },
      { property: "og:description", content: "Approve or reject submitted experiences." },
    ],
  }),
  component: Moderation,
});

function Moderation() {
  const { status, page } = Route.useSearch();
  const navigate = Route.useNavigate();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin", "experiences", status, page], queryFn: () => admin.experiences(status, page), placeholderData: keepPreviousData });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "experiences"] });
  const approve = useMutation({ mutationFn: admin.approveExperience, onSuccess: () => { toast.success("Approved"); refresh(); }, onError: (e) => toast.error(errorMessage(e)) });
  const reject = useMutation({ mutationFn: (v: { id: string; reason: string }) => admin.rejectExperience(v.id, v.reason), onSuccess: () => { toast.success("Rejected"); refresh(); }, onError: (e) => toast.error(errorMessage(e)) });

  return (
    <>
      <PageHeader title="Experience moderation" description="Check content, pricing and terms before experiences go live." />
      <div className="mb-6 flex gap-1.5 overflow-x-auto">
        {STATUSES.map((s) => (
          <button key={s} onClick={() => navigate({ search: { status: s, page: 0 } })} aria-pressed={status === s}
            className={cn("rounded-full px-3.5 py-1.5 text-sm", status === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>
      {q.isLoading ? <LoadingState /> : q.error ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : q.data!.content.length === 0 ? (
        <EmptyState title="Nothing to moderate" description="No experiences with this status." />
      ) : (
        <>
          <ul className="space-y-4">
            {q.data!.content.map((e) => (
              <li key={e.id} className="rounded-2xl border bg-card p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">{e.merchantName}</p>
                    <h3 className="text-lg font-semibold">{e.title}</h3>
                    <p className="text-sm">{formatMoney(e.price.amountMinor, e.price.currency)} · {e.category}</p>
                  </div>
                  <StatusBadge status={e.status} />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{e.description}</p>
                <p className="mt-3 text-sm">Includes: {e.inclusions.join(", ")}{e.exclusions.length ? ` · Excludes: ${e.exclusions.join(", ")}` : ""}</p>
                {e.terms && <p className="mt-1 text-sm text-muted-foreground">Valid {e.terms.validityDays} days · {e.terms.redemptionInstructions}</p>}
                {e.status === "REJECTED" && e.rejectionReason && <p className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-sm">{e.rejectionReason}</p>}
                {e.status === "SUBMITTED" && (
                  <div className="mt-5 flex gap-2">
                    <Button size="sm" onClick={() => approve.mutate(e.id)} disabled={approve.isPending}>Approve</Button>
                    <RejectDialog onReject={(reason) => reject.mutate({ id: e.id, reason })} pending={reject.isPending} />
                  </div>
                )}
              </li>
            ))}
          </ul>
          <Pager page={page} totalPages={q.data!.totalPages} onPage={(p) => navigate({ search: { status, page: p } })} />
        </>
      )}
    </>
  );
}
