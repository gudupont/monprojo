"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { setActiveProfileCookie } from "@/lib/session";

const AVATAR_COLORS = ["#f97316", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#eab308"];

export async function createProfile(formData: FormData) {
  const name = formData.get("name");
  if (typeof name !== "string" || name.trim().length === 0) {
    throw new Error("Le nom du profil est requis");
  }

  const count = await db.profile.count();
  const avatarColor = AVATAR_COLORS[count % AVATAR_COLORS.length];

  const profile = await db.profile.create({
    data: { name: name.trim(), avatarColor },
  });

  await setActiveProfileCookie(profile.id);
  redirect("/search");
}

export async function selectProfile(formData: FormData) {
  const profileId = formData.get("profileId");
  if (typeof profileId !== "string") {
    throw new Error("Profil invalide");
  }

  await setActiveProfileCookie(profileId);
  redirect("/search");
}
