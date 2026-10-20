import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/public-header";
import { Field, TextInput } from "@/components/ui-kit";
import { auth } from "@/lib/api/endpoints";
import { errorMessage } from "@/lib/api/client";

const schema = z.object({ email: z.string().trim().email("Enter a valid email address") });

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — SortedDate Partners" },
      { name: "description", content: "Request a password reset link." },
      { property: "og:title", content: "Reset your password — SortedDate Partners" },
      { property: "og:description", content: "Request a password reset link." },
    ],
  }),
  component: Forgot,
});

function Forgot() {
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  const m = useMutation({ mutationFn: (v: z.infer<typeof schema>) => auth.requestPasswordReset(v.email) });
  return (
    <AuthLayout title="Reset your password" subtitle="We'll email you a link to choose a new password.">
      {m.isSuccess ? (
        <p className="rounded-xl bg-success-soft px-4 py-3 text-sm text-success">
          If an account exists for that address, a reset link is on its way.
        </p>
      ) : (
        <form className="space-y-4" onSubmit={form.handleSubmit((v) => m.mutate(v))} noValidate>
          <Field label="Email" htmlFor="email" error={form.formState.errors.email?.message}>
            <TextInput id="email" type="email" autoComplete="email" {...form.register("email")} />
          </Field>
          {m.error && <p className="text-sm text-destructive" role="alert">{errorMessage(m.error)}</p>}
          <Button type="submit" className="h-11 w-full rounded-xl" disabled={m.isPending}>
            {m.isPending ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
      <Link to="/login" search={{ redirect: undefined }} className="mt-6 block text-center text-sm hover:underline">Back to sign in</Link>
    </AuthLayout>
  );
}
