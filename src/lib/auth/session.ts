import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

import type { UserRole } from "@/types/auth";

const COOKIE_NAME = "salamah_session";
const MAX_AGE_SECONDS = 60 * 60 * 8;

type Session = { userId: string; email: string; role: UserRole; expiresAt: number; credentialTag?: string };

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is not configured.");
  return value;
}

function sign(value: string) { return createHmac("sha256", secret()).update(value).digest("base64url"); }
export function credentialTag(passwordHash: string) { return sign(`credential:${passwordHash}`); }

export function createSessionToken(user: Omit<Session, "expiresAt">) {
  const payload = Buffer.from(JSON.stringify({ ...user, expiresAt: Date.now() + MAX_AGE_SECONDS * 1000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readSessionToken(token?: string): Session | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(signature);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Session;
    return typeof session.userId === "string" && typeof session.expiresAt === "number" && session.expiresAt > Date.now() ? session : null;
  } catch { return null; }
}

export const getSession = cache(async () => {
  try {
    const session = readSessionToken((await cookies()).get(COOKIE_NAME)?.value);
    if (!session) return null;
    const [user] = await db
      .select({ id: users.id, email: users.email, role: users.role, status: users.status, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);
    if (!user || user.status !== "active" || session.credentialTag !== credentialTag(user.passwordHash)) return null;
    return { ...session, email: user.email, role: user.role };
  } catch (error: any) {
    if (error?.digest === "DYNAMIC_SERVER_USAGE" || error?.message?.includes?.("DYNAMIC_SERVER_USAGE")) {
      throw error;
    }
    console.error("Session database verification error (resilient fallback):", error);
    return null;
  }
});

export const sessionCookie = {
  name: COOKIE_NAME,
  options: { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: MAX_AGE_SECONDS },
};
