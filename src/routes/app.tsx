import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { LayoutGrid, MapPin, Sparkles, Users } from "lucide-react";
import { AppShell, type NavItem } from "@/components/app-shell";
import { requireUser } from "@/lib/guards";
import { merchantRoleOf } from "@/lib/lifecycle";

const NAV: NavItem[] = [
  { to: "/app", label: "Overview", icon: LayoutGrid, exact: true },
  { to: "/app/locations", label: "Locations", icon: MapPin },
  { to: "/app/experiences", label: "Experiences", icon: Sparkles },
  { to: "/app/team", label: "Team", icon: Users },
];

export const Route = createFileRoute("/app")({
  ssr: false,
  beforeLoad: async ({ context, location }) => {
    const me = await requireUser(context.queryClient, location);
    // Users without merchant access (not yet approved) continue onboarding instead.
    if (me && !merchantRoleOf(me.roles)) throw redirect({ to: "/onboarding", search: { step: 1 } });
    return { me };
  },
  head: () => ({
    meta: [
      { title: "Partner portal — SortedDate" },
      { name: "description", content: "Manage your restaurant, locations, experiences and team." },
      { property: "og:title", content: "Partner portal — SortedDate" },
      { property: "og:description", content: "Manage your restaurant on SortedDate." },
    ],
  }),
  component: () => (
    <AppShell nav={NAV} suffix="Partners">
      <Outlet />
    </AppShell>
  ),
});
