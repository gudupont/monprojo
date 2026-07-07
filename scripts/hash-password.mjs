import { randomBytes, scryptSync } from "node:crypto";

const KEY_LENGTH = 64;

const password = process.argv[2];

if (!password) {
  console.error("Usage: node scripts/hash-password.mjs <mot-de-passe>");
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");

console.log(`scrypt:${salt}:${hash}`);
