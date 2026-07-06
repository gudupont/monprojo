"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getActiveProfile } from "@/lib/session";

export async function toggleEpisodeWatched(mediaId: string, season: number, episode: number) {
  const profile = await getActiveProfile();
  if (!profile) throw new Error("Aucun profil actif");

  const existing = await db.episodeWatch.findUnique({
    where: {
      mediaId_profileId_season_episode: { mediaId, profileId: profile.id, season, episode },
    },
  });

  if (existing) {
    await db.episodeWatch.delete({ where: { id: existing.id } });
  } else {
    await db.episodeWatch.create({ data: { mediaId, profileId: profile.id, season, episode } });
  }

  revalidatePath("/", "layout");
}
