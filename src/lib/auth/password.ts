import { scryptSync, timingSafeEqual } from "node:crypto";

export function verifyPassword(password: string): boolean {
  const stored = process.env.APP_PASSWORD_HASH;
  if (!stored) return false;

  const [algo, salt, hash] = stored.split(":");
  if (algo !== "scrypt" || !salt || !hash) return false;

  const expected = Buffer.from(hash, "hex");
  const derived = scryptSync(password, salt, expected.length);

  return derived.length === expected.length && timingSafeEqual(derived, expected);
}
