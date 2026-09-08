import "server-only";

import { scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

export function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, hash] = storedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !hash) return false;
  const candidate = scryptSync(password, salt, KEY_LENGTH);
  const stored = Buffer.from(hash, "hex");
  return stored.length === candidate.length && timingSafeEqual(stored, candidate);
}
