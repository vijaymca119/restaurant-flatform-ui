import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, CircleDashed, MapPin, Plus, Receipt, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EmptyState, ErrorState, LoadingState, PageHeader, Panel, StatusBadge } from "@/components/ui-kit";
import { useMe } from "@/components/app-shell";
import { experiencesQuery, profileQuery, venuesQuery } from "@/lib/api/endpoints";
import type { ExperienceStatus } from "@/lib/api/types";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Overview — SortedDate Partners" },
      { name: "description", content: "Your restaurant at a glance." },
      { property: "og:title", content: "Overview — SortedDate Partners" },
      { property: "og:description", content: "Your restaurant at a glance." },
    ],
  }),
  component: Dashboard,
});

const SUMMARY: ExperienceStatus[] = ["PUBLISHED", "SUBMITTED", "PAUSED", "REJECTED"];
const SUMMARY_LABEL: Record<string, string> = {
  PUBLISHED: "Published",
  SUBMITTED: "Pending review",
  PAUSED: "Paused",
  REJECTED: "Rejected",
};

function Dashboard() {
  const { data: me } = useMe();
  const profile = useQuery(profileQuery());
  const venues = useQuery(venuesQuery());
  const exps = useQuery(experiencesQuery());

  if (profile.isLoading) return <LoadingState />;
  if (profile.error) return (<><PageHeader title="Welcome" /><ErrorState error={profile.error} onRetry={() => profile.refetch()} /></>);

  const p = profile.data!;
  const venueList = venues.data?.content ?? [];
  const expList = exps.data?.content ?? [];
  const steps = [
    { label: "Business verified", done: p.status === "APPROVED" },
    { label: "Add a location", done: venueList.length > 0 },
    { label: "Location approved", done: venueList.some((v) => v.status === "APPROVED") },
    { label: "Create an experience", done: expList.length > 0 },
    { label: "Publish an experience", done: expList.some((e) => e.status === "PUBLISHED") },
  ];
  const pct = Math.round((steps.filter((s) => s.done).length / steps.length) * 100);
  const actions = [
    ...venueList.filter((v) => v.status === "DRAFT").map((v) => ({ text: `Submit location "${v.name}" for review`, to: "/app/locations" as const })),
    ...venueList.filter((v) => v.status === "REJECTED").map((v) => ({ text: `Location "${v.name}" needs changes`, to: "/app/locations" as const })),
    ...expList.filter((e) => e.status === "APPROVED").map((e) => ({ text: `"${e.title}" is approved — publish it`, to: "/app/experiences" as const })),
    ...expList.filter((e) => e.status === "DRAFT").map((e) => ({ text: `Finish and submit "${e.title}"`, to: "/app/experiences" as const })),
  ];
  const recent = [...expList].sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "")).slice(0, 5);

  return (
    <>
      <PageHeader
        title={`Welcome${me?.displayName ? `, ${me.displayName.split(" ")[0]}` : ""}`}
        description={p.tradingName ?? p.legalName}
        actions={
          <>
            <Button asChild variant="outline" className="rounded-full"><Link to="/app/locations"><MapPin className="size-4" /> Add location</Link></Button>
            <Button asChild className="rounded-full"><Link to="/app/experiences/new"><Plus className="size-4" /> New experience</Link></Button>
          </>
        }
      />
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Getting set up</h2>
            <span className="text-sm text-muted-foreground">{pct}% complete</span>
          </div>
          <Progress value={pct} className="mt-4 h-1.5" />
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {steps.map((s) => (
              <li key={s.label} className="flex items-center gap-2.5 text-sm">
                {s.done ? <CheckCircle2 className="size-4 text-success" aria-hidden /> : <CircleDashed className="size-4 text-muted-foreground" aria-hidden />}
                <span className={s.done ? "" : "text-muted-foreground"}>{s.label}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel>
          <h2 className="font-semibold">Business verification</h2>
          <div className="mt-4"><StatusBadge status={p.status} /></div>
          <p className="mt-3 text-sm text-muted-foreground">
            {p.status === "APPROVED" ? (p.active ? "Your business is verified and active." : "Verified, but currently inactive.") : "Our team is reviewing your business."}
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-4 border-t pt-5">
            <div><dt className="text-xs text-muted-foreground">Locations</dt><dd className="text-2xl font-semibold">{venues.data?.totalElements ?? "—"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Experiences</dt><dd className="text-2xl font-semibold">{exps.data?.totalElements ?? "—"}</dd></div>
          </dl>
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {SUMMARY.map((s) => (
          <Panel key={s} className="p-5">
            <p className="text-sm text-muted-foreground">{SUMMARY_LABEL[s]}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">{exps.data ? expList.filter((e) => e.status === s).length : "—"}</p>
          </Panel>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel>
          <h2 className="font-semibold">Outstanding actions</h2>
          {actions.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">You're all caught up.</p>
          ) : (
            <ul className="mt-4 divide-y">
              {actions.slice(0, 6).map((a) => (
                <li key={a.text}><Link to={a.to} className="block py-3 text-sm hover:text-info">{a.text}</Link></li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel>
          <h2 className="font-semibold">Recent activity</h2>
          {recent.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Changes to your experiences will appear here.</p>
          ) : (
            <ul className="mt-4 divide-y">
              {recent.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <Link to="/app/experiences/$experienceId" params={{ experienceId: e.id }} className="truncate hover:text-info">{e.title}</Link>
                  <StatusBadge status={e.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <h2 className="mb-4 mt-12 font-semibold">Sales & vouchers</h2>
      <div className="grid gap-5 md:grid-cols-2">
        <EmptyState icon={<Receipt className="size-5" />} title="Sales and payouts aren't connected yet" description="Revenue and payment data will appear here once payments are live for your account." />
        <EmptyState icon={<Ticket className="size-5" />} title="No vouchers yet" description="Issued and redeemed vouchers will show here after your first published experience sells." />
      </div>
      {exps.error && <div className="mt-5"><ErrorState error={exps.error} onRetry={() => exps.refetch()} /></div>}
    </>
  );
}
