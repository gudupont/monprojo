import { SignJWT } from "jose";
import type { BrowserContext } from "@playwright/test";

export async function loginAs(
  context: BrowserContext,
  profileId: string,
  baseURL: string,
): Promise<void> {
  const secret = new TextEncoder().encode(process.env.SESSION_SECRET);
  const token = await new SignJWT({ authenticated: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + 60 * 60)
    .sign(secret);

  await context.addCookies([
    { name: "monprojo_session", value: token, url: baseURL },
    { name: "monprojo_profile_id", value: profileId, url: baseURL },
  ]);
}
