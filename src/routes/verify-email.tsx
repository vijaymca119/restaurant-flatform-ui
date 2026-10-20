import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/public-header";
import { auth } from "@/lib/api/endpoints";
import { errorMessage } from "@/lib/api/client";

export const Route = createFileRoute("/verify-email")({
  validateSearch: (s: Record<string, unknown>) => ({
    email: typeof s["email"] === "string" ? s["email"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Check your email — SortedDate Partners" },
      { name: "description", content: "Confirm your email address to continue." },
      { property: "og:title", content: "Check your email — SortedDate Partners" },
      { property: "og:description", content: "Confirm your email address to continue." },
    ],
  }),
  component: Verify,
});

function Verify() {
  const { email } = Route.useSearch();
  const m = useMutation({ mutationFn: () => auth.resendVerification(email ?? "") });
  return (
    <AuthLayout title="Check your email">
      <div className="flex flex-col items-center text-center">
        <MailCheck className="size-10 text-success" aria-hidden />
        <p className="mt-4 text-muted-foreground">
          We sent a confirmation link{email ? <> to <strong className="text-foreground">{email}</strong></> : null}.
          Open it to activate your account, then sign in.
        </p>
        {email && (
          <Button variant="outline" className="mt-6 rounded-xl" onClick={() => m.mutate()} disabled={m.isPending || m.isSuccess}>
            {m.isSuccess ? "Link sent" : m.isPending ? "Sending…" : "Resend link"}
          </Button>
        )}
        {m.error && <p className="mt-3 text-sm text-destructive">{errorMessage(m.error)}</p>}
        <Link to="/login" search={{ redirect: undefined }} className="mt-6 text-sm hover:underline">Back to sign in</Link>
      </div>
    </AuthLayout>
  );
}
