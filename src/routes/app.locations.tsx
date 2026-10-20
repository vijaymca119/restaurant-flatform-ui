import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Pencil, Plus, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from "@/components/ui-kit";
import { LocationForm } from "@/components/location-form";
import { useMe } from "@/components/app-shell";
import { merchant, profileQuery, venuesQuery } from "@/lib/api/endpoints";
import { errorMessage } from "@/lib/api/client";
import { can, canSubmitVenue, merchantRoleOf } from "@/lib/lifecycle";
import { countryName } from "@/lib/reference";
import type { LocationDraft, Venue } from "@/lib/api/types";

export const Route = createFileRoute("/app/locations")({
  head: () => ({
    meta: [
      { title: "Locations — SortedDate Partners" },
      { name: "description", content: "Manage your restaurant locations." },
      { property: "og:title", content: "Locations — SortedDate Partners" },
      { property: "og:description", content: "Manage your restaurant locations." },
    ],
  }),
  component: Locations,
});

function Locations() {
  const { data: me } = useMe();
  const role = merchantRoleOf(me?.roles ?? []);
  const canManage = can(role, "venues:manage");
  const qc = useQueryClient();
  const venues = useQuery(venuesQuery());
  const profile = useQuery(profileQuery());
  const [editing, setEditing] = useState<Venue | "new" | null>(null);

  const save = useMutation({
    mutationFn: (v: LocationDraft) =>
      editing && editing !== "new" ? merchant.updateVenue(editing.id, v) : merchant.createVenue(v),
    onSuccess: () => {
      toast.success("Location saved");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["merchant", "venues"] });
    },
  });
  const submit = useMutation({
    mutationFn: merchant.submitVenue,
    onSuccess: () => {
      toast.success("Location submitted for review");
      qc.invalidateQueries({ queryKey: ["merchant", "venues"] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const submittable = canSubmitVenue(profile.data);

  return (
    <>
      <PageHeader
        title="Locations"
        description="Every place guests can redeem your experiences."
        actions={canManage && <Button className="rounded-full" onClick={() => setEditing("new")}><Plus className="size-4" /> Add location</Button>}
      />
      {profile.data && !submittable && (
        <p className="mb-6 rounded-xl bg-info-soft px-4 py-3 text-sm text-info">
          You can save locations now. Submitting them for review becomes available once your business is approved and active.
        </p>
      )}
      {venues.isLoading ? (
        <LoadingState />
      ) : venues.error ? (
        <ErrorState error={venues.error} onRetry={() => venues.refetch()} />
      ) : venues.data!.content.length === 0 ? (
        <EmptyState icon={<MapPin className="size-5" />} title="No locations yet" description="Add your first restaurant location to start creating experiences." action={canManage && <Button onClick={() => setEditing("new")}>Add location</Button>} />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {venues.data!.content.map((v) => (
            <li key={v.id} className="rounded-2xl border bg-card p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{v.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {v.addressLine1}{v.addressLine2 ? `, ${v.addressLine2}` : ""}<br />
                    {v.postalCode} {v.city}, {countryName(v.country)}
                  </p>
                </div>
                <StatusBadge status={v.status} />
              </div>
              {v.status === "REJECTED" && v.rejectionReason && (
                <p className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-destructive">{v.rejectionReason}</p>
              )}
              <p className="mt-3 text-xs text-muted-foreground">{v.phone} · {v.timeZone}</p>
              {canManage && (
                <div className="mt-5 flex gap-2">
                  {(v.status === "DRAFT" || v.status === "REJECTED") && (
                    <Button variant="outline" size="sm" onClick={() => setEditing(v)}><Pencil className="size-3.5" /> Edit</Button>
                  )}
                  {v.status === "DRAFT" && (
                    <Button size="sm" disabled={!submittable || submit.isPending} onClick={() => submit.mutate(v.id)} title={submittable ? undefined : "Available once your business is approved"}>
                      <Send className="size-3.5" /> Submit for review
                    </Button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "Add location" : "Edit location"}</DialogTitle>
            <DialogDescription>Details guests will see when redeeming.</DialogDescription>
          </DialogHeader>
          {editing !== null && (
            <LocationForm
              key={editing === "new" ? "new" : editing.id}
              defaultValues={editing === "new" ? undefined : editing}
              onSubmit={(v) => save.mutate(v)}
            />
          )}
          {save.error && <p className="text-sm text-destructive" role="alert">{errorMessage(save.error)}</p>}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" form="location-form" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save location"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
