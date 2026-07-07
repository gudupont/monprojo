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

export async function markSeasonWatched(
  mediaId: string,
  season: number,
  episodeNumbers: number[],
  additionalSeasons?: { season: number; episodeNumbers: number[] }[],
) {
  const profile = await getActiveProfile();
  if (!profile) throw new Error("Aucun profil actif");

  const seasonsToMark = [{ season, episodeNumbers }, ...(additionalSeasons ?? [])];

  await db.$transaction(
    seasonsToMark.flatMap(({ season: s, episodeNumbers: eps }) =>
      eps.map((episode) =>
        db.episodeWatch.upsert({
          where: {
            mediaId_profileId_season_episode: { mediaId, profileId: profile.id, season: s, episode },
          },
          create: { mediaId, profileId: profile.id, season: s, episode },
          update: {},
        }),
      ),
    ),
  );

  revalidatePath("/", "layout");
}

export async function unmarkSeasonWatched(
  mediaId: string,
  season: number,
  additionalSeasons?: { season: number }[],
) {
  const profile = await getActiveProfile();
  if (!profile) throw new Error("Aucun profil actif");

  const seasons = [season, ...(additionalSeasons ?? []).map((s) => s.season)];

  await db.$transaction(
    seasons.map((s) =>
      db.episodeWatch.deleteMany({
        where: { mediaId, profileId: profile.id, season: s },
      }),
    ),
  );

  revalidatePath("/", "layout");
}
