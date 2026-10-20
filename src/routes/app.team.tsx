import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trash2, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, Field, LoadingState, NativeSelect, PageHeader, Panel, StatusBadge, TextInput } from "@/components/ui-kit";
import { useMe } from "@/components/app-shell";
import { team, teamQuery } from "@/lib/api/endpoints";
import { errorMessage } from "@/lib/api/client";
import { assignableRoles, can, canManageMember, merchantRoleOf } from "@/lib/lifecycle";
import { ROLE_LABEL } from "@/lib/reference";
import type { MerchantRole } from "@/lib/api/types";

export const Route = createFileRoute("/app/team")({
  head: () => ({
    meta: [
      { title: "Team — SortedDate Partners" },
      { name: "description", content: "Invite team members and manage their roles." },
      { property: "og:title", content: "Team — SortedDate Partners" },
      { property: "og:description", content: "Invite team members and manage their roles." },
    ],
  }),
  component: Team,
});

const inviteSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(255),
  role: z.enum(["MERCHANT_OWNER", "MERCHANT_MANAGER", "MERCHANT_STAFF"]),
});

function Team() {
  const { data: me } = useMe();
  const role = merchantRoleOf(me?.roles ?? []);
  const roles = assignableRoles(role);
  const qc = useQueryClient();
  const q = useQuery({ ...teamQuery(), enabled: can(role, "team:view") || !me });
  const refresh = () => qc.invalidateQueries({ queryKey: ["merchant", "team"] });

  const form = useForm<z.infer<typeof inviteSchema>>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: "MERCHANT_STAFF" },
  });
  const invite = useMutation({
    mutationFn: team.invite,
    onSuccess: () => { toast.success("Invitation sent"); form.reset({ email: "", role: "MERCHANT_STAFF" }); refresh(); },
  });
  const update = useMutation({
    mutationFn: (v: { id: string; role: MerchantRole }) => team.update(v.id, { role: v.role }),
    onSuccess: () => { toast.success("Role updated"); refresh(); },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: team.remove,
    onSuccess: () => { toast.success("Member removed"); refresh(); },
    onError: (e) => toast.error(errorMessage(e)),
  });

  if (me && !can(role, "team:view")) {
    return (<><PageHeader title="Team" /><EmptyState title="Ask an owner or manager" description="Your role doesn't include team management." /></>);
  }

  return (
    <>
      <PageHeader title="Team" description="Owners manage everyone. Managers can invite and manage staff." />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div>
          {q.isLoading ? (
            <LoadingState />
          ) : q.error ? (
            <ErrorState error={q.error} onRetry={() => q.refetch()} />
          ) : q.data!.content.length === 0 ? (
            <EmptyState icon={<Users className="size-5" />} title="Just you so far" description="Invite managers and staff to help run your locations." />
          ) : (
            <ul className="divide-y rounded-2xl border bg-card">
              {q.data!.content.map((m) => {
                const manageable = canManageMember(role, m.role) && m.id !== me?.id;
                return (
                  <li key={m.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{m.displayName ?? m.email}</p>
                      <p className="truncate text-sm text-muted-foreground">{m.email}</p>
                    </div>
                    {m.invitationStatus !== "ACCEPTED" && <StatusBadge status={m.invitationStatus} />}
                    {manageable && roles.length > 1 ? (
                      <NativeSelect
                        aria-label={`Role for ${m.email}`}
                        className="h-9 w-32"
                        value={m.role}
                        onChange={(e) => update.mutate({ id: m.id, role: e.target.value as MerchantRole })}
                      >
                        {roles.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                      </NativeSelect>
                    ) : (
                      <span className="w-32 text-sm text-muted-foreground">{ROLE_LABEL[m.role]}</span>
                    )}
                    {manageable ? (
                      <Button variant="ghost" size="icon" aria-label={`Remove ${m.email}`} onClick={() => confirm(`Remove ${m.email}?`) && remove.mutate(m.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    ) : <span className="size-9" />}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {can(role, "team:invite") || !me ? (
          <Panel className="self-start">
            <h2 className="flex items-center gap-2 font-semibold"><UserPlus className="size-4" /> Invite a member</h2>
            <form className="mt-5 space-y-4" noValidate onSubmit={form.handleSubmit((v) => invite.mutate(v))}>
              <Field label="Email" htmlFor="invite-email" error={form.formState.errors.email?.message}>
                <TextInput id="invite-email" type="email" {...form.register("email")} />
              </Field>
              <Field label="Role" htmlFor="invite-role">
                <NativeSelect id="invite-role" {...form.register("role")}>
                  {(roles.length ? roles : (["MERCHANT_STAFF"] as MerchantRole[])).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                </NativeSelect>
              </Field>
              {invite.error && <p className="text-sm text-destructive" role="alert">{errorMessage(invite.error)}</p>}
              <Button type="submit" className="w-full rounded-xl" disabled={invite.isPending}>{invite.isPending ? "Sending…" : "Send invitation"}</Button>
            </form>
          </Panel>
        ) : null}
      </div>
    </>
  );
}
