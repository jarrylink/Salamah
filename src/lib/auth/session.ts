import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

import type { UserRole } from "@/types/auth";

const COOKIE_NAME = "salamah_session";
const MAX_AGE_SECONDS = 60 * 60 * 8;

type Session = { userId: string; email: string; role: UserRole; expiresAt: number };

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is not configured.");
  return value;
}

function sign(value: string) { return createHmac("sha256", secret()).update(value).digest("base64url"); }

export function createSessionToken(user: Omit<Session, "expiresAt">) {
  const payload = Buffer.from(JSON.stringify({ ...user, expiresAt: Date.now() + MAX_AGE_SECONDS * 1000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readSessionToken(token?: string): Session | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(signature);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Session;
    return session.expiresAt > Date.now() ? session : null;
  } catch { return null; }
}

export async function getSession() { return readSessionToken((await cookies()).get(COOKIE_NAME)?.value); }

export const sessionCookie = {
  name: COOKIE_NAME,
  options: { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: MAX_AGE_SECONDS },
};
