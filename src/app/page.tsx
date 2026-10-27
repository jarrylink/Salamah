import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, people } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { getCmsSections } from "@/lib/services/cms";
import { getSystemSettings } from "@/lib/services/settings";
import { LandingPageClient } from "@/features/landing/landing-page-client";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [sections, settings, session] = await Promise.all([
    getCmsSections(),
    getSystemSettings(),
    getSession(),
  ]);

  let currentUser: {
    id: string;
    email: string;
    role: string;
    name?: string;
    avatarUrl?: string;
  } | null = null;

  if (session?.userId) {
    try {
      const [userRecord] = await db
        .select({
          id: users.id,
          email: users.email,
          role: users.role,
          firstName: people.firstName,
          lastName: people.lastName,
          avatarUrl: people.avatarUrl,
        })
        .from(users)
        .leftJoin(people, eq(users.personId, people.id))
        .where(eq(users.id, session.userId))
        .limit(1);

      if (userRecord) {
        const fullName = [userRecord.firstName, userRecord.lastName].filter(Boolean).join(" ");
        currentUser = {
          id: userRecord.id,
          email: userRecord.email,
          role: userRecord.role,
          name: fullName || userRecord.email.split("@")[0],
          avatarUrl: userRecord.avatarUrl || undefined,
        };
      }
    } catch (err) {
      console.error("Home user record query error:", err);
    }
  }

  const admissionsConfig = (settings?.admissions_configuration as Record<string, unknown>) || {};
  const feePerChildKobo = typeof admissionsConfig.applicationFeeKobo === "number"
    ? admissionsConfig.applicationFeeKobo
    : 2500000;

  const schoolProfile = (settings?.school_profile as Record<string, unknown>) || {};

  return (
    <LandingPageClient
      sections={sections}
      feePerChildKobo={feePerChildKobo}
      schoolProfile={schoolProfile}
      currentUser={currentUser}
    />
  );
}

