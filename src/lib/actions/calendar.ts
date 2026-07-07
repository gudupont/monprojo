"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getActiveProfile } from "@/lib/session";

export async function createPlanEntry(formData: FormData) {
  const profile = await getActiveProfile();
  if (!profile) throw new Error("Aucun profil actif");

  const mediaId = formData.get("mediaId");
  const scheduledAt = formData.get("scheduledAt");
  const notes = formData.get("notes");

  if (typeof mediaId !== "string" || typeof scheduledAt !== "string" || !scheduledAt) {
    throw new Error("Données de planification invalides");
  }

  await db.planEntry.create({
    data: {
      mediaId,
      scheduledAt: new Date(scheduledAt),
      createdByProfileId: profile.id,
      notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
    },
  });

  revalidatePath("/calendar");
}

export async function deletePlanEntry(entryId: string) {
  await db.planEntry.delete({ where: { id: entryId } });
  revalidatePath("/calendar");
}

export async function getOrCreateCalendarToken(): Promise<string> {
  const profile = await getActiveProfile();
  if (!profile) throw new Error("Aucun profil actif");

  if (profile.calendarToken) return profile.calendarToken;

  const token = crypto.randomUUID();
  await db.profile.update({
    where: { id: profile.id },
    data: { calendarToken: token },
  });

  return token;
}

export async function regenerateCalendarToken(): Promise<string> {
  const profile = await getActiveProfile();
  if (!profile) throw new Error("Aucun profil actif");

  const token = crypto.randomUUID();
  await db.profile.update({
    where: { id: profile.id },
    data: { calendarToken: token },
  });

  revalidatePath("/calendar");
  return token;
}
