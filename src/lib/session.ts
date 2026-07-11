import { cookies } from "next/headers";
import { db } from "@/lib/db";

const PROFILE_COOKIE = "monprojo_profile_id";

export async function getActiveProfile() {
  const cookieStore = await cookies();
  const profileId = cookieStore.get(PROFILE_COOKIE)?.value;
  if (!profileId) return null;

  return db.profile.findUnique({ where: { id: profileId } });
}

export async function setActiveProfileCookie(profileId: string) {
  const cookieStore = await cookies();
  cookieStore.set(PROFILE_COOKIE, profileId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function clearActiveProfileCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(PROFILE_COOKIE);
}
