"use server";

import { db } from "@/lib/db";
import { getMediaDetail, getWatchProviders, type TmdbMediaType } from "@/lib/tmdb";
import { getImdbRating } from "@/lib/omdb";
import { parseSeasons } from "@/lib/progress";

const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24h

export async function getOrRefreshMedia(tmdbId: number, type: TmdbMediaType) {
  const existing = await db.media.findUnique({ where: { tmdbId } });
  const hasIncompleteSeasons =
    existing?.type === "TV" &&
    (existing.seasonsJson === null ||
      parseSeasons(existing.seasonsJson).some((s) => !Array.isArray(s.episodes)));
  const hasMissingRuntime = existing
    ? existing.type === "MOVIE"
      ? existing.runtimeMinutes === null
      : existing.episodeRuntimeMinutes === null
    : false;
  const isFresh =
    existing &&
    !hasIncompleteSeasons &&
    !hasMissingRuntime &&
    Date.now() - existing.cachedAt.getTime() < CACHE_TTL_MS;
  if (isFresh) {
    return existing;
  }

  const detail = await getMediaDetail(tmdbId, type);

  let imdbRating: number | null = null;
  if (detail.imdbId) {
    try {
      imdbRating = await getImdbRating(detail.imdbId);
    } catch {
      imdbRating = null;
    }
  }

  let watchProvidersJson: string | null = null;
  try {
    watchProvidersJson = JSON.stringify(await getWatchProviders(tmdbId, type));
  } catch {
    watchProvidersJson = null;
  }

  const genres = detail.genres.join(",") || null;
  const seasonsJson = detail.seasons ? JSON.stringify(detail.seasons) : null;

  return db.$transaction(async (tx) => {
    const media = await tx.media.upsert({
      where: { tmdbId },
      create: {
        tmdbId: detail.tmdbId,
        imdbId: detail.imdbId,
        type: detail.type === "movie" ? "MOVIE" : "TV",
        title: detail.title,
        poster: detail.poster,
        overview: detail.overview,
        releaseDate: detail.releaseDate,
        tmdbRating: detail.tmdbRating,
        imdbRating,
        genres,
        seasonsJson,
        watchProvidersJson,
        runtimeMinutes: detail.runtime,
        episodeRuntimeMinutes: detail.episodeRunTime,
      },
      update: {
        imdbId: detail.imdbId,
        title: detail.title,
        poster: detail.poster,
        overview: detail.overview,
        releaseDate: detail.releaseDate,
        tmdbRating: detail.tmdbRating,
        imdbRating,
        genres,
        seasonsJson,
        watchProvidersJson,
        runtimeMinutes: detail.runtime,
        episodeRuntimeMinutes: detail.episodeRunTime,
        cachedAt: new Date(),
      },
    });

    const actors = await Promise.all(
      detail.cast.map((c) =>
        tx.actor.upsert({
          where: { tmdbId: c.tmdbId },
          create: { tmdbId: c.tmdbId, name: c.name, profilePath: c.profilePath },
          update: { name: c.name, profilePath: c.profilePath },
        })
      )
    );

    await tx.mediaCast.deleteMany({ where: { mediaId: media.id } });
    if (actors.length > 0) {
      await tx.mediaCast.createMany({
        data: detail.cast.map((c, index) => ({
          mediaId: media.id,
          actorId: actors[index].id,
          character: c.character,
          order: index,
        })),
      });
    }

    return media;
  });
}
