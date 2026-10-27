import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";

import { SuperadminShell } from "@/features/dashboard/components/superadmin-shell";
import { db } from "@/db";
import { academicSessions, academicTerms } from "@/db/schema";
import { resolveAcademicContext } from "@/features/academic/lib/context";
import { getSession } from "@/lib/auth/session";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const session = await getSession();
  if (!session) redirect("/");

  if (session.role === "superadmin" || session.role === "admin") {
    const [sessions, terms, context] = await Promise.all([
      db
        .select({ id: academicSessions.id, name: academicSessions.name })
        .from(academicSessions)
        .orderBy(asc(academicSessions.name)),
      db
        .select({ id: academicTerms.id, sessionId: academicTerms.sessionId, name: academicTerms.name })
        .from(academicTerms)
        .orderBy(asc(academicTerms.termNumber)),
      resolveAcademicContext(),
    ]);
    return (
      <SuperadminShell
        email={session.email}
        sessions={sessions}
        terms={terms}
        sessionId={context?.sessionId}
        termId={context?.termId}
      >
        {children}
      </SuperadminShell>
    );
  }

  return children;
}
