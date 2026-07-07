import { getOrRefreshMedia } from "@/lib/actions/media";
import { findByImdbId, searchMediaByTitleAndYear } from "@/lib/tmdb";
import type { PlexMediaType, PlexWatchlistItem } from "@/lib/plex";

function extractGuidId(externalGuids: string[], prefix: string): string | null {
  const guid = externalGuids.find((g) => g.startsWith(prefix));
  return guid ? guid.slice(prefix.length) : null;
}

function toTmdbType(type: PlexMediaType): "movie" | "tv" {
  return type === "movie" ? "movie" : "tv";
}

export async function resolveTmdbIdFromGuids(
  externalGuids: string[],
  title: string,
  year: number | null,
  type: "movie" | "tv",
): Promise<number | null> {
  const directTmdbId = extractGuidId(externalGuids, "tmdb://");
  if (directTmdbId) {
    return Number(directTmdbId);
  }

  const imdbId = extractGuidId(externalGuids, "imdb://");
  if (imdbId) {
    const found = await findByImdbId(imdbId);
    if (found) return found.tmdbId;
  }

  const found = await searchMediaByTitleAndYear(title, year, type);
  return found?.tmdbId ?? null;
}

export async function resolvePlexTmdbId(item: PlexWatchlistItem): Promise<number | null> {
  return resolveTmdbIdFromGuids(item.externalGuids, item.title, item.year, toTmdbType(item.type));
}

export async function resolvePlexItemToMedia(item: PlexWatchlistItem) {
  const tmdbId = await resolvePlexTmdbId(item);
  if (!tmdbId) return null;

  return getOrRefreshMedia(tmdbId, toTmdbType(item.type));
}
