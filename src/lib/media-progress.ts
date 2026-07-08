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

  return Math.min(100, Math.round((watched / total) * 100));
}
