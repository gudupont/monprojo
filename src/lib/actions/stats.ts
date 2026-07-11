import { db } from "@/lib/db";

export interface WatchStats {
  series: {
    watchMinutes: number;
    episodesWatched: number;
    seriesAdded: number;
  };
  movies: {
    watchMinutes: number;
    moviesWatched: number;
    moviesAdded: number;
  };
}

export async function getWatchStats(profileId: string): Promise<WatchStats> {
  const [episodeWatches, seriesAdded, watchedMovies, moviesAdded] = await Promise.all([
    db.episodeWatch.findMany({
      where: { profileId },
      select: { media: { select: { episodeRuntimeMinutes: true } } },
    }),
    db.watchlistItem.count({ where: { profileId, media: { type: "TV" } } }),
    db.watchlistItem.findMany({
      where: { profileId, status: "WATCHED", media: { type: "MOVIE" } },
      select: { media: { select: { runtimeMinutes: true } } },
    }),
    db.watchlistItem.count({ where: { profileId, media: { type: "MOVIE" } } }),
  ]);

  const seriesWatchMinutes = episodeWatches.reduce(
    (total, watch) => total + (watch.media.episodeRuntimeMinutes ?? 0),
    0
  );

  const moviesWatchMinutes = watchedMovies.reduce(
    (total, item) => total + (item.media.runtimeMinutes ?? 0),
    0
  );

  return {
    series: {
      watchMinutes: seriesWatchMinutes,
      episodesWatched: episodeWatches.length,
      seriesAdded,
    },
    movies: {
      watchMinutes: moviesWatchMinutes,
      moviesWatched: watchedMovies.length,
      moviesAdded,
    },
  };
}
