"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getActiveProfile } from "@/lib/session";
import { computeProgressPercent } from "@/lib/media-progress";
import { nextWatchStatus } from "@/lib/cron/refresh-watchlist";
import { parseSeasons, selectReleasedEpisodes } from "@/lib/progress";

async function syncWatchStatusForMedia(mediaId: string, profileId: string) {
  const watchlistItem = await db.watchlistItem.findUnique({
    where: { mediaId_profileId: { mediaId, profileId } },
  });
  if (!watchlistItem) return;

  const media = await db.media.findUnique({ where: { id: mediaId } });
  if (!media) return;

  const percent = await computeProgressPercent(media, profileId, watchlistItem.status);
  const next = nextWatchStatus(watchlistItem.status, percent);
  await db.watchlistItem.update({
    where: { id: watchlistItem.id },
    data: { ...next, hiddenFromContinue: false },
  });
}

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

  await syncWatchStatusForMedia(mediaId, profile.id);

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

  await syncWatchStatusForMedia(mediaId, profile.id);

  revalidatePath("/", "layout");
}

export async function unmarkSeasonWatched(mediaId: string, season: number) {
  const profile = await getActiveProfile();
  if (!profile) throw new Error("Aucun profil actif");

  await db.episodeWatch.deleteMany({
    where: { mediaId, profileId: profile.id, season },
  });

  await syncWatchStatusForMedia(mediaId, profile.id);

  revalidatePath("/", "layout");
}

export async function unmarkSeriesWatched(mediaId: string) {
  const profile = await getActiveProfile();
  if (!profile) throw new Error("Aucun profil actif");

  await db.episodeWatch.deleteMany({
    where: { mediaId, profileId: profile.id },
  });

  await syncWatchStatusForMedia(mediaId, profile.id);

  revalidatePath("/", "layout");
}

export async function markSeriesWatched(mediaId: string) {
  const profile = await getActiveProfile();
  if (!profile) throw new Error("Aucun profil actif");

  const media = await db.media.findUnique({ where: { id: mediaId } });
  if (!media) throw new Error("Média introuvable");

  const today = new Date().toISOString().slice(0, 10);
  const seasons = parseSeasons(media.seasonsJson);
  const episodesToMark = selectReleasedEpisodes(seasons, today);

  await db.$transaction(
    episodesToMark.map(({ season, episode }) =>
      db.episodeWatch.upsert({
        where: {
          mediaId_profileId_season_episode: { mediaId, profileId: profile.id, season, episode },
        },
        create: { mediaId, profileId: profile.id, season, episode },
        update: {},
      }),
    ),
  );

  await syncWatchStatusForMedia(mediaId, profile.id);

  revalidatePath("/", "layout");
}
