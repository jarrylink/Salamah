import { SuperadminDashboard } from "@/features/dashboard/components/superadmin-dashboard";
import { RoleWorkspace } from "@/features/dashboard/components/role-workspace";
import { getSession } from "@/lib/auth/session";

export default async function DashboardPage() {
  // DashboardLayout establishes authentication; this page selects the role view.
  const session = await getSession();

  if (session?.role === "superadmin") return <SuperadminDashboard />;
  if (session) return <RoleWorkspace role={session.role} />;

  return null;
}
