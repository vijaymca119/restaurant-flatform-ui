import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ErrorState, LoadingState, PageHeader, StatusBadge } from "@/components/ui-kit";
import { ExperienceForm, toFull, type ExperienceOutput } from "@/components/experience-form";
import { useMe } from "@/components/app-shell";
import { experienceQuery, experiences, venuesQuery } from "@/lib/api/endpoints";
import { errorMessage } from "@/lib/api/client";
import { can, experienceActions, merchantRoleOf } from "@/lib/lifecycle";
import type { Experience } from "@/lib/api/types";

export const Route = createFileRoute("/app/experiences/$experienceId")({
  head: () => ({
    meta: [
      { title: "Experience — SortedDate Partners" },
      { name: "description", content: "Edit, submit and publish your experience." },
      { property: "og:title", content: "Experience — SortedDate Partners" },
      { property: "og:description", content: "Edit, submit and publish your experience." },
    ],
  }),
  component: ExperienceDetail,
});

const ACTION_LABEL = { submit: "Submit for review", publish: "Publish", pause: "Pause sales", archive: "Archive" } as const;
type TransitionAction = keyof typeof ACTION_LABEL;

function toDefaults(e: Experience) {
  const digits = new Intl.NumberFormat("en", { style: "currency", currency: e.price.currency }).resolvedOptions().maximumFractionDigits ?? 2;
  return {
    title: e.title,
    description: e.description,
    category: e.category,
    price: e.price.amountMinor / 10 ** digits,
    currency: e.price.currency,
    inclusions: e.inclusions.join("\n"),
    exclusions: e.exclusions.join("\n"),
    venueKeys: e.venueIds ?? [],
    validityDays: e.terms?.validityDays ?? 365,
    bookingLeadHours: e.availability?.bookingLeadHours ?? 24,
    weekdays: e.availability?.weekdays ?? [],
    blackoutDates: (e.availability?.blackoutDates ?? []).join(", "),
    redemptionInstructions: e.terms?.redemptionInstructions ?? "",
  };
}

function ExperienceDetail() {
  const { experienceId } = Route.useParams();
  const { data: me } = useMe();
  const canManage = can(merchantRoleOf(me?.roles ?? []), "experiences:manage");
  const qc = useQueryClient();
  const q = useQuery(experienceQuery(experienceId));
  const venues = useQuery(venuesQuery());
  const refresh = () => qc.invalidateQueries({ queryKey: ["merchant", "experiences"] });

  const save = useMutation({
    mutationFn: (v: ExperienceOutput) => experiences.save(experienceId, toFull(v)),
    onSuccess: () => { toast.success("Changes saved"); refresh(); },
  });
  const transition = useMutation({
    mutationFn: (a: TransitionAction) => experiences.transition(experienceId, a),
    onSuccess: (_d, a) => { toast.success(`${ACTION_LABEL[a]} — done`); refresh(); },
    onError: (e) => toast.error(errorMessage(e)),
  });

  if (q.isLoading || venues.isLoading) return <LoadingState />;
  if (q.error) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const e = q.data!;
  const actions = experienceActions(e.status);
  const editable = canManage && actions.includes("edit");
  const transitions = actions.filter((a): a is TransitionAction => a !== "edit");

  return (
    <>
      <Link to="/app/experiences" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Experiences</Link>
      <PageHeader
        title={e.title}
        description={editable ? "Draft — edit freely, then submit for review." : "Locked while in this state. Archive and recreate to make changes."}
        actions={
          <>
            <StatusBadge status={e.status} className="self-center" />
            {canManage && transitions.map((a) =>
              a === "archive" ? (
                <AlertDialog key={a}>
                  <AlertDialogTrigger asChild><Button variant="outline" className="rounded-full">Archive</Button></AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Archive this experience?</AlertDialogTitle>
                      <AlertDialogDescription>It will stop selling and can't be restored. Vouchers already sold stay valid.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => transition.mutate("archive")}>Archive</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <Button key={a} className="rounded-full" variant={a === "pause" ? "outline" : "default"} disabled={transition.isPending} onClick={() => transition.mutate(a)}>
                  {e.status === "PAUSED" && a === "publish" ? "Resume sales" : ACTION_LABEL[a]}
                </Button>
              ),
            )}
          </>
        }
      />
      {e.status === "REJECTED" && (
        <div className="mb-8 rounded-2xl bg-danger-soft p-5 text-sm" role="alert">
          <p className="font-medium text-destructive">Not approved</p>
          <p className="mt-1 text-foreground">{e.rejectionReason ?? "No reason was provided."}</p>
        </div>
      )}
      {e.status === "SUBMITTED" && <p className="mb-8 rounded-2xl bg-info-soft p-5 text-sm text-info">Our team is reviewing this experience. You'll be able to publish it once approved.</p>}
      <ExperienceForm
        defaultValues={toDefaults(e)}
        disabled={!editable}
        venueOptions={(venues.data?.content ?? []).map((v) => ({ value: v.id, label: v.name }))}
        onSubmit={(v) => save.mutate(v)}
        footer={
          editable && (
            <div className="flex items-center gap-3 border-t pt-6">
              <Button type="submit" size="lg" className="rounded-full" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save changes"}</Button>
              {save.error && <p className="text-sm text-destructive" role="alert">{errorMessage(save.error)}</p>}
            </div>
          )
        }
      />
    </>
  );
}
