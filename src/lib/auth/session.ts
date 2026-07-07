import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "monprojo_session";

const SHORT_SESSION_SECONDS = 60 * 60 * 24; // 1 jour
const LONG_SESSION_SECONDS = 60 * 60 * 24 * 30; // 30 jours

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET n'est pas défini");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(rememberMe: boolean) {
  const maxAge = rememberMe ? LONG_SESSION_SECONDS : SHORT_SESSION_SECONDS;
  const token = await new SignJWT({ authenticated: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + maxAge)
    .sign(getSecretKey());

  return { token, maxAge };
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload.authenticated === true;
  } catch {
    return false;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  return verifySessionToken(token);
}
