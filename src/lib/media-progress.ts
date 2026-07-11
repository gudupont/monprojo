import { db } from "@/lib/db";
import { parseSeasons, totalEpisodes, seasonEpisodeNumbers } from "@/lib/progress";
import type { Media, WatchStatus } from "@prisma/client";

function statusFallbackPercent(status: WatchStatus): number {
  if (status === "WATCHED") return 100;
  if (status === "WATCHING") return 50;
  return 0;
}

export async function computeProgressPercent(
  media: Media,
  profileId: string,
  status: WatchStatus,
): Promise<number> {
  if (media.type === "MOVIE") {
    return statusFallbackPercent(status);
  }

  const seasons = parseSeasons(media.seasonsJson);
  const total = totalEpisodes(seasons);
  if (!total) return statusFallbackPercent(status);

  const validEpisodesBySeason = new Map(seasons.map((s) => [s.season, new Set(seasonEpisodeNumbers(s))]));
  const watches = await db.episodeWatch.findMany({
    where: { mediaId: media.id, profileId },
    select: { season: true, episode: true },
  });
  // Ignore les EpisodeWatch orphelins (saison/épisode disparu depuis un refresh TMDb) pour éviter un % > 100.
  const watched = watches.filter((w) => validEpisodesBySeason.get(w.season)?.has(w.episode) ?? false).length;

  return watched === total ? 100 : Math.min(99, Math.floor((watched / total) * 100));
}

export async function computeProgressPercentBatch(
  items: { media: Media; status: WatchStatus }[],
  profileId: string,
): Promise<Map<string, number>> {
  const tvMediaIds = items.filter((i) => i.media.type !== "MOVIE").map((i) => i.media.id);
  const watches = tvMediaIds.length
    ? await db.episodeWatch.findMany({
        where: { mediaId: { in: tvMediaIds }, profileId },
        select: { mediaId: true, season: true, episode: true },
      })
    : [];

  const watchesByMedia = new Map<string, { season: number; episode: number }[]>();
  for (const w of watches) {
    const arr = watchesByMedia.get(w.mediaId);
    if (arr) arr.push(w);
    else watchesByMedia.set(w.mediaId, [w]);
  }

  const result = new Map<string, number>();
  for (const { media, status } of items) {
    if (media.type === "MOVIE") {
      result.set(media.id, statusFallbackPercent(status));
      continue;
    }

    const seasons = parseSeasons(media.seasonsJson);
    const total = totalEpisodes(seasons);
    if (!total) {
      result.set(media.id, statusFallbackPercent(status));
      continue;
    }

    const validEpisodesBySeason = new Map(seasons.map((s) => [s.season, new Set(seasonEpisodeNumbers(s))]));
    // Ignore les EpisodeWatch orphelins (saison/épisode disparu depuis un refresh TMDb) pour éviter un % > 100.
    const watched = (watchesByMedia.get(media.id) ?? []).filter(
      (w) => validEpisodesBySeason.get(w.season)?.has(w.episode) ?? false,
    ).length;

    result.set(media.id, watched === total ? 100 : Math.min(99, Math.floor((watched / total) * 100)));
  }

  return result;
}
