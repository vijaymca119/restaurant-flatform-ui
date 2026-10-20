import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/public-header";

export const Route = createFileRoute("/session-expired")({
  validateSearch: (s: Record<string, unknown>) => ({
    reason: s["reason"] === "forbidden" ? ("forbidden" as const) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Session ended — SortedDate Partners" },
      { name: "description", content: "Your session has ended. Please sign in again." },
      { property: "og:title", content: "Session ended — SortedDate Partners" },
      { property: "og:description", content: "Please sign in again." },
    ],
  }),
  component: Expired,
});

function Expired() {
  const { reason } = Route.useSearch();
  return (
    <AuthLayout title={reason === "forbidden" ? "Access not available" : "Your session has ended"}>
      <div className="flex flex-col items-center text-center">
        <Clock className="size-10 text-muted-foreground" aria-hidden />
        <p className="mt-4 text-muted-foreground">
          {reason === "forbidden"
            ? "Your account doesn't have permission to open that area."
            : "For your security we signed you out. Sign in again to pick up where you left off."}
        </p>
        <Button asChild className="mt-6 h-11 w-full rounded-xl">
          <Link to="/login" search={{ redirect: undefined }}>Sign in</Link>
        </Button>
      </div>
    </AuthLayout>
  );
}
