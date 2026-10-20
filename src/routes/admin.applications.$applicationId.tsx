import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState, PageHeader, Panel, StatusBadge } from "@/components/ui-kit";
import { RejectDialog } from "@/components/reject-dialog";
import { admin, applicationQuery } from "@/lib/api/endpoints";
import { errorMessage } from "@/lib/api/client";
import { formatMoney } from "@/lib/lifecycle";
import { countryName } from "@/lib/reference";

export const Route = createFileRoute("/admin/applications/$applicationId")({
  head: () => ({
    meta: [
      { title: "Application review — SortedDate Review" },
      { name: "description", content: "Review a merchant application." },
      { property: "og:title", content: "Application review — SortedDate Review" },
      { property: "og:description", content: "Review a merchant application." },
    ],
  }),
  component: ApplicationReview,
});

function ApplicationReview() {
  const { applicationId } = Route.useParams();
  const qc = useQueryClient();
  const q = useQuery(applicationQuery(applicationId));
  const audit = useQuery({ queryKey: ["admin", "audit", applicationId], queryFn: () => admin.audit(0, applicationId) });
  const done = (msg: string) => { toast.success(msg); qc.invalidateQueries({ queryKey: ["application", applicationId] }); qc.invalidateQueries({ queryKey: ["admin"] }); };
  const approve = useMutation({ mutationFn: () => admin.approveApplication(applicationId), onSuccess: () => done("Application approved"), onError: (e) => toast.error(errorMessage(e)) });
  const reject = useMutation({ mutationFn: (r: string) => admin.rejectApplication(applicationId, r), onSuccess: () => done("Application rejected"), onError: (e) => toast.error(errorMessage(e)) });

  if (q.isLoading) return <LoadingState />;
  if (q.error) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const a = q.data!;
  const fx = a.firstExperience;
  const Row = ({ k, v }: { k: string; v?: string | null | undefined }) => (<div className="flex justify-between gap-4 py-2 text-sm"><dt className="text-muted-foreground">{k}</dt><dd className="text-right">{v || "—"}</dd></div>);

  return (
    <>
      <Link to="/admin/applications" search={{ status: "SUBMITTED", page: 0 }} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Applications</Link>
      <PageHeader
        title={a.legalName ?? "Application"}
        description={a.tradingName ?? undefined}
        actions={<>
          <StatusBadge status={a.status} className="self-center" />
          {a.status === "SUBMITTED" && <>
            <RejectDialog onReject={(r) => reject.mutate(r)} pending={reject.isPending} />
            <Button size="sm" onClick={() => approve.mutate()} disabled={approve.isPending}>Approve</Button>
          </>}
        </>}
      />
      {a.status === "REJECTED" && a.rejectionReason && <p className="mb-6 rounded-xl bg-danger-soft p-4 text-sm"><strong className="text-destructive">Rejected:</strong> {a.rejectionReason}</p>}
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <h2 className="font-semibold">Business</h2>
          <dl className="mt-3 divide-y">
            <Row k="Country" v={countryName(a.country)} /><Row k="Registration no." v={a.registrationNumber} /><Row k="Tax ID" v={a.taxId} />
            <Row k="Currency" v={a.defaultCurrency} /><Row k="Business type" v={a.businessType} />
            <Row k="Submitted" v={a.submittedAt ? new Date(a.submittedAt).toLocaleString() : null} />
          </dl>
        </Panel>
        <Panel>
          <h2 className="font-semibold">Verification documents</h2>
          <ul className="mt-3 space-y-2">
            {(a.documents ?? []).map((d) => (
              <li key={d.id} className="flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm">
                <FileText className="size-4 text-muted-foreground" /><span className="flex-1 truncate">{d.fileName}</span>
                <span className="text-xs text-muted-foreground">{d.documentType}</span><StatusBadge status={d.verificationStatus ?? "PENDING"} />
              </li>
            ))}
            {!a.documents?.length && <li className="text-sm text-muted-foreground">No documents uploaded.</li>}
          </ul>
        </Panel>
        <Panel>
          <h2 className="font-semibold">Locations</h2>
          <ul className="mt-3 divide-y text-sm">
            {(a.locations ?? []).map((l, i) => <li key={i} className="py-2.5"><p className="font-medium">{l.name}</p><p className="text-muted-foreground">{l.addressLine1}, {l.postalCode} {l.city}, {countryName(l.country)} · {l.phone}</p></li>)}
            {!a.locations?.length && <li className="text-muted-foreground">None.</li>}
          </ul>
        </Panel>
        <Panel>
          <h2 className="font-semibold">First experience</h2>
          {fx ? (
            <div className="mt-3 text-sm">
              <p className="font-medium">{fx.title} · {formatMoney(fx.price.amountMinor, fx.price.currency)}</p>
              <p className="mt-1 text-muted-foreground">{fx.description}</p>
              <p className="mt-2">Includes: {fx.inclusions.join(", ")}</p>
              {fx.exclusions.length > 0 && <p>Excludes: {fx.exclusions.join(", ")}</p>}
              <p className="mt-2 text-muted-foreground">Valid {fx.validityDays} days · {fx.weekdays.join(", ")} · {fx.bookingLeadHours}h lead</p>
            </div>
          ) : <p className="mt-3 text-sm text-muted-foreground">Not provided.</p>}
        </Panel>
      </div>
      <Panel className="mt-5">
        <h2 className="font-semibold">Audit history</h2>
        {audit.isLoading ? <LoadingState /> : audit.error ? <p className="mt-3 text-sm text-muted-foreground">{errorMessage(audit.error)}</p> : (
          <ul className="mt-3 divide-y text-sm">
            {audit.data!.content.map((ev) => <li key={ev.id} className="flex justify-between gap-4 py-2.5"><span>{ev.action}{ev.actorEmail ? ` · ${ev.actorEmail}` : ""}</span><span className="text-muted-foreground">{new Date(ev.occurredAt).toLocaleString()}</span></li>)}
            {audit.data!.content.length === 0 && <li className="text-muted-foreground">No events yet.</li>}
          </ul>
        )}
      </Panel>
    </>
  );
}
