import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/public-header";
import { Field, TextInput } from "@/components/ui-kit";
import { auth } from "@/lib/api/endpoints";
import { ApiError, errorMessage, isApiConfigured } from "@/lib/api/client";
import { isPlatformStaff, merchantRoleOf } from "@/lib/lifecycle";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s["redirect"] === "string" && s["redirect"].startsWith("/") ? s["redirect"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — SortedDate Partners" },
      { name: "description", content: "Sign in to manage your restaurant on SortedDate." },
      { property: "og:title", content: "Sign in — SortedDate Partners" },
      { property: "og:description", content: "Sign in to manage your restaurant on SortedDate." },
    ],
  }),
  component: Login,
});

function Login() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  const m = useMutation({
    mutationFn: (v: z.infer<typeof schema>) => auth.login(v.email, v.password),
    onSuccess: (me) => {
      qc.setQueryData(["me"], me);
      if (redirect) return navigate({ to: redirect });
      if (isPlatformStaff(me.roles)) return navigate({ to: "/admin/applications", search: { status: "SUBMITTED", page: 0 } });
      if (merchantRoleOf(me.roles)) return navigate({ to: "/app" });
      return navigate({ to: "/onboarding", search: { step: 1 } });
    },
  });
  const err = m.error;
  const unverified = err instanceof ApiError && err.code === "EMAIL_NOT_VERIFIED";

  return (
    <AuthLayout title="Sign in" subtitle="Welcome back to SortedDate Partners.">
      {!isApiConfigured() && (
        <p className="mb-5 rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning">
          The partner API isn't connected yet, so sign-in is unavailable.
        </p>
      )}
      <form className="space-y-4" onSubmit={form.handleSubmit((v) => m.mutate(v))} noValidate>
        <Field label="Email" htmlFor="email" error={form.formState.errors.email?.message}>
          <TextInput id="email" type="email" autoComplete="email" {...form.register("email")} />
        </Field>
        <Field label="Password" htmlFor="password" error={form.formState.errors.password?.message}>
          <TextInput id="password" type="password" autoComplete="current-password" {...form.register("password")} />
        </Field>
        <div className="text-right text-sm">
          <Link to="/forgot-password" className="text-info hover:underline">Forgot password?</Link>
        </div>
        {err && (
          <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-destructive" role="alert">
            {unverified ? (
              <>Please verify your email first. <Link to="/verify-email" search={{ email: form.getValues("email") }} className="underline">Resend link</Link></>
            ) : err instanceof ApiError && err.status === 401 ? (
              "That email and password don't match."
            ) : (
              errorMessage(err)
            )}
          </p>
        )}
        <Button type="submit" className="h-11 w-full rounded-xl" disabled={m.isPending}>
          {m.isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to SortedDate? <Link to="/signup" className="text-foreground underline-offset-4 hover:underline">Create an account</Link>
      </p>
    </AuthLayout>
  );
}
