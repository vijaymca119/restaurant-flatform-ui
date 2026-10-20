import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { ClipboardCheck, History, Sparkles } from "lucide-react";
import { AppShell, type NavItem } from "@/components/app-shell";
import { requireUser } from "@/lib/guards";
import { isPlatformStaff } from "@/lib/lifecycle";

const NAV: NavItem[] = [
  { to: "/admin/applications", label: "Applications", icon: ClipboardCheck },
  { to: "/admin/experiences", label: "Experiences", icon: Sparkles },
  { to: "/admin/audit", label: "Audit history", icon: History },
];

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async ({ context, location }) => {
    const me = await requireUser(context.queryClient, location);
    if (me && !isPlatformStaff(me.roles)) {
      throw redirect({ to: "/session-expired", search: { reason: "forbidden" } });
    }
    return { me };
  },
  head: () => ({
    meta: [
      { title: "Platform review — SortedDate" },
      { name: "description", content: "Review merchant applications and experiences." },
      { property: "og:title", content: "Platform review — SortedDate" },
      { property: "og:description", content: "Platform administration." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AppShell nav={NAV} suffix="Review">
      <Outlet />
    </AppShell>
  ),
});
