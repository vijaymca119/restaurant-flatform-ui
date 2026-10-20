import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/public-header";
import { Field, TextInput } from "@/components/ui-kit";
import { auth } from "@/lib/api/endpoints";
import { errorMessage, isApiConfigured } from "@/lib/api/client";

const schema = z.object({
  displayName: z.string().trim().min(2, "Enter your name").max(100),
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z
    .string()
    .min(10, "Use at least 10 characters")
    .regex(/[A-Za-z]/, "Include a letter")
    .regex(/[0-9]/, "Include a number"),
});

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your account — SortedDate Partners" },
      { name: "description", content: "Create a SortedDate account to start your restaurant partner application." },
      { property: "og:title", content: "Create your account — SortedDate Partners" },
      { property: "og:description", content: "Start your restaurant partner application." },
    ],
  }),
  component: Signup,
});

function Signup() {
  const navigate = useNavigate();
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  const m = useMutation({
    mutationFn: auth.register,
    onSuccess: (_d, v) => navigate({ to: "/verify-email", search: { email: v.email } }),
  });
  const e = form.formState.errors;
  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start with a personal account. Restaurant access is granted once your business is approved."
    >
      <form className="space-y-4" onSubmit={form.handleSubmit((v) => m.mutate(v))} noValidate>
        <Field label="Full name" htmlFor="displayName" error={e.displayName?.message}>
          <TextInput id="displayName" autoComplete="name" {...form.register("displayName")} />
        </Field>
        <Field label="Email" htmlFor="email" error={e.email?.message}>
          <TextInput id="email" type="email" autoComplete="email" {...form.register("email")} />
        </Field>
        <Field label="Password" htmlFor="password" error={e.password?.message} hint="At least 10 characters with a letter and a number.">
          <TextInput id="password" type="password" autoComplete="new-password" {...form.register("password")} />
        </Field>
        {m.error && (
          <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-destructive" role="alert">
            {errorMessage(m.error)}
          </p>
        )}
        <Button type="submit" className="h-11 w-full rounded-xl" disabled={m.isPending || !isApiConfigured()}>
          {m.isPending ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account? <Link to="/login" search={{ redirect: undefined }} className="text-foreground hover:underline">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
