import { db } from "@/lib/db";
import type { Media, Profile } from "@prisma/client";
import {
  getPlexAccountWatchlist,
  getPlexServerWatchedMovies,
  getPlexServerWatchedEpisodes,
  findPlexDiscoverItemByTmdbId,
  addToPlexAccountWatchlist,
} from "@/lib/plex";
import { resolvePlexItemToMedia, resolveTmdbIdFromGuids } from "@/lib/plex-resolve";

export async function syncProfileWatchlistFromPlex(profile: Profile): Promise<void> {
  if (!profile.plexAccountToken) return;

  const watchlist = await getPlexAccountWatchlist(profile.plexAccountToken);

  for (const item of watchlist) {
    const media = await resolvePlexItemToMedia(item);
    if (!media) continue;

    const existing = await db.watchlistItem.findUnique({
      where: { mediaId_profileId: { mediaId: media.id, profileId: profile.id } },
    });
    if (existing) continue;

    await db.watchlistItem.create({
      data: { mediaId: media.id, profileId: profile.id, status: "TO_WATCH" },
    });
  }
}

export async function syncProfileWatchedStatusFromPlex(profile: Profile): Promise<void> {
  if (!profile.plexServerUrl || !profile.plexServerToken) return;

  const [watchedMovies, watchedEpisodes] = await Promise.all([
    getPlexServerWatchedMovies(profile.plexServerUrl, profile.plexServerToken),
    getPlexServerWatchedEpisodes(profile.plexServerUrl, profile.plexServerToken),
  ]);

  for (const movie of watchedMovies) {
    const tmdbId = await resolveTmdbIdFromGuids(movie.externalGuids, movie.title, movie.year, "movie");
    if (!tmdbId) continue;

    const media = await db.media.findUnique({ where: { tmdbId } });
    if (!media) continue;

    const existing = await db.watchlistItem.findUnique({
      where: { mediaId_profileId: { mediaId: media.id, profileId: profile.id } },
    });
    if (!existing || existing.status === "WATCHED") continue;

    await db.watchlistItem.update({ where: { id: existing.id }, data: { status: "WATCHED" } });
  }

  for (const ep of watchedEpisodes) {
    const tmdbId = await resolveTmdbIdFromGuids(ep.showExternalGuids, ep.showTitle, null, "tv");
    if (!tmdbId) continue;

    const media = await db.media.findUnique({ where: { tmdbId } });
    if (!media) continue;

    const inWatchlist = await db.watchlistItem.findUnique({
      where: { mediaId_profileId: { mediaId: media.id, profileId: profile.id } },
    });
    if (!inWatchlist) continue;

    await db.episodeWatch.upsert({
      where: {
        mediaId_profileId_season_episode: {
          mediaId: media.id,
          profileId: profile.id,
          season: ep.season,
          episode: ep.episode,
        },
      },
      create: { mediaId: media.id, profileId: profile.id, season: ep.season, episode: ep.episode },
      update: {},
    });
  }
}

export async function syncProfileFromPlex(profile: Profile): Promise<void> {
  await syncProfileWatchlistFromPlex(profile);
  await syncProfileWatchedStatusFromPlex(profile);
}

export async function pushMediaToPlexWatchlist(profile: Profile, media: Media): Promise<void> {
  if (!profile.plexAccountToken) return;

  try {
    const ratingKey = await findPlexDiscoverItemByTmdbId(
      profile.plexAccountToken,
      media.tmdbId,
      media.type === "MOVIE" ? "movie" : "show",
      media.title,
      media.releaseDate ? Number(media.releaseDate.slice(0, 4)) : null,
    );
    if (!ratingKey) return;

    await addToPlexAccountWatchlist(profile.plexAccountToken, ratingKey);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue lors du push vers la Plex Watchlist.";
    await db.profile.update({ where: { id: profile.id }, data: { plexSyncError: message } });
  }
}
