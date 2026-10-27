import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionToken, credentialTag, sessionCookie } from "@/lib/auth/session";
import type { UserRole } from "@/types/auth";

export const runtime = "nodejs";

const credentialsSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1)
    .transform((val) => (val.includes("@") ? val.toLowerCase() : `${val.toLowerCase()}@salamah.ng`)),
  password: z.string().min(1).max(256),
});

export async function POST(request: Request) {
  const parsed = credentialsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Enter a valid email address and password." }, { status: 400 });
  const [user] = await db.select().from(users).where(eq(users.email, parsed.data.identifier.toLowerCase())).limit(1);
  if (!user || user.status !== "active" || !verifyPassword(parsed.data.password, user.passwordHash)) return NextResponse.json({ message: "Incorrect credentials or account unavailable." }, { status: 401 });
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
  const response = NextResponse.json({ redirectTo: "/dashboard" });
  response.cookies.set(sessionCookie.name, createSessionToken({ userId: user.id, email: user.email, role: user.role as UserRole, credentialTag: credentialTag(user.passwordHash) }), sessionCookie.options);
  return response;
}
