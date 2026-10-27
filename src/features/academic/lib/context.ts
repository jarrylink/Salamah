import "server-only";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { cookies } from "next/headers";

import { db } from "@/db";
import { academicSessions, academicTerms } from "@/db/schema";

export type AcademicContext = { sessionId: string; termId: string; sessionName: string; termName: string };

/** Resolves the same context for a page and every query it makes. */
export async function resolveAcademicContext(input?: { sessionId?: string; termId?: string }): Promise<AcademicContext | null> {
  if (!input?.sessionId && !input?.termId) {
    const preference = (await cookies()).get("salamah_academic_context")?.value;
    if (preference) {
      try {
        const parsed = z.object({ sessionId: z.uuid(), termId: z.uuid() }).safeParse(JSON.parse(decodeURIComponent(preference)));
        if (parsed.success) input = parsed.data;
      } catch { /* A malformed preference falls back to the current school period. */ }
    }
  }
  if ((input?.sessionId && !z.uuid().safeParse(input.sessionId).success) || (input?.termId && !z.uuid().safeParse(input.termId).success)) return null;
  const [session] = input?.sessionId
    ? await db.select().from(academicSessions).where(eq(academicSessions.id, input.sessionId)).limit(1)
    : await db.select().from(academicSessions).where(eq(academicSessions.isCurrent, true)).limit(1);
  if (!session) return null;

  const [term] = input?.termId
    ? await db.select().from(academicTerms).where(and(eq(academicTerms.id, input.termId), eq(academicTerms.sessionId, session.id))).limit(1)
    : await db.select().from(academicTerms).where(and(eq(academicTerms.sessionId, session.id), eq(academicTerms.isCurrent, true))).limit(1);
  return term ? { sessionId: session.id, termId: term.id, sessionName: session.name, termName: term.name } : null;
}
