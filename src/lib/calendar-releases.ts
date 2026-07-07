import type { EpisodeWatch, Media, WatchlistItem } from "@prisma/client";
import { db } from "@/lib/db";
import { parseSeasons } from "@/lib/progress";

export interface ReleaseEntry {
  id: string;
  date: Date;
  media: Media;
  label: string | null;
}

type WatchlistItemWithMedia = WatchlistItem & { media: Media };

export function todayLocalISODate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateStringToLocalMidnight(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00`);
}

export function deriveUpcomingReleases(
  watchlist: WatchlistItemWithMedia[],
  episodeWatches: Pick<EpisodeWatch, "mediaId" | "season" | "episode">[],
  today: string
): ReleaseEntry[] {
  const watchedEpisodes = new Set(episodeWatches.map((e) => `${e.mediaId}-${e.season}-${e.episode}`));

  const entries: ReleaseEntry[] = [];

  for (const item of watchlist) {
    const media = item.media;

    if (media.type === "MOVIE") {
      if (media.releaseDate && media.releaseDate >= today) {
        entries.push({
          id: `release-${media.id}`,
          date: dateStringToLocalMidnight(media.releaseDate),
          media,
          label: null,
        });
      }
      continue;
    }

    const seasons = parseSeasons(media.seasonsJson);
    for (const season of seasons) {
      for (const episode of season.episodes ?? []) {
        if (!episode.airDate || episode.airDate < today) continue;
        if (watchedEpisodes.has(`${media.id}-${season.season}-${episode.episode}`)) continue;

        entries.push({
          id: `release-${media.id}-${season.season}-${episode.episode}`,
          date: dateStringToLocalMidnight(episode.airDate),
          media,
          label: `S${season.season}E${episode.episode}`,
        });
      }
    }
  }

  return entries.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export async function getUpcomingReleases(profileId: string): Promise<ReleaseEntry[]> {
  const [watchlist, episodeWatches] = await Promise.all([
    db.watchlistItem.findMany({
      where: { profileId, status: { in: ["TO_WATCH", "WATCHING"] } },
      include: { media: true },
    }),
    db.episodeWatch.findMany({ where: { profileId } }),
  ]);

  return deriveUpcomingReleases(watchlist, episodeWatches, todayLocalISODate());
}
