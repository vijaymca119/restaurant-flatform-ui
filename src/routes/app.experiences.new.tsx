import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState, PageHeader } from "@/components/ui-kit";
import { ExperienceForm, toFull, type ExperienceOutput } from "@/components/experience-form";
import { experiences, venuesQuery } from "@/lib/api/endpoints";
import { errorMessage } from "@/lib/api/client";

export const Route = createFileRoute("/app/experiences/new")({
  head: () => ({
    meta: [
      { title: "New experience — SortedDate Partners" },
      { name: "description", content: "Create a new prepaid dining experience." },
      { property: "og:title", content: "New experience — SortedDate Partners" },
      { property: "og:description", content: "Create a new prepaid dining experience." },
    ],
  }),
  component: NewExperience,
});

function NewExperience() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const venues = useQuery(venuesQuery());
  const save = useMutation({
    mutationFn: (v: ExperienceOutput) => experiences.save(null, toFull(v)),
    onSuccess: (exp) => {
      toast.success("Draft saved");
      qc.invalidateQueries({ queryKey: ["merchant", "experiences"] });
      navigate({ to: "/app/experiences/$experienceId", params: { experienceId: exp.id } });
    },
  });

  return (
    <>
      <Link to="/app/experiences" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Experiences</Link>
      <PageHeader title="New experience" description="Saved as a draft. You can submit it for review afterwards." />
      {venues.isLoading ? (
        <LoadingState />
      ) : venues.error ? (
        <ErrorState error={venues.error} onRetry={() => venues.refetch()} />
      ) : (
        <ExperienceForm
          venueOptions={venues.data!.content.map((v) => ({ value: v.id, label: v.name }))}
          onSubmit={(v) => save.mutate(v)}
          footer={
            <div className="flex items-center gap-3 border-t pt-6">
              <Button type="submit" size="lg" className="rounded-full" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save draft"}</Button>
              {save.error && <p className="text-sm text-destructive" role="alert">{errorMessage(save.error)}</p>}
            </div>
          }
        />
      )}
    </>
  );
}
