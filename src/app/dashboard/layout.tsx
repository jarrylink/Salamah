import { redirect } from "next/navigation";

import { SuperadminShell } from "@/features/dashboard/components/superadmin-shell";
import { getSession } from "@/lib/auth/session";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const session = await getSession();
  if (!session) redirect("/");

  if (session.role === "superadmin") return <SuperadminShell email={session.email}>{children}</SuperadminShell>;

  return children;
}
