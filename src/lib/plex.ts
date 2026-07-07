const PLEX_TV_BASE_URL = "https://plex.tv/api/v2";
const PLEX_METADATA_BASE_URL = "https://metadata.provider.plex.tv";
const PLEX_DISCOVER_BASE_URL = "https://discover.provider.plex.tv";
const PLEX_CLIENT_IDENTIFIER = "monprojo";

export type PlexMediaType = "movie" | "show";

export interface PlexWatchlistItem {
  ratingKey: string;
  guid: string;
  title: string;
  year: number | null;
  type: PlexMediaType;
  externalGuids: string[];
}

export interface PlexWatchedMovie {
  guid: string;
  externalGuids: string[];
  title: string;
  year: number | null;
}

export interface PlexWatchedEpisode {
  showGuid: string;
  showExternalGuids: string[];
  showTitle: string;
  season: number;
  episode: number;
}

async function plexFetch<T>(url: string, token: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      "X-Plex-Token": token,
      "X-Plex-Client-Identifier": PLEX_CLIENT_IDENTIFIER,
      ...init.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`Erreur Plex (${response.status}) sur ${url}`);
  }
  return response.json() as Promise<T>;
}

export async function testPlexAccountConnection(accountToken: string): Promise<boolean> {
  try {
    await plexFetch(`${PLEX_TV_BASE_URL}/user`, accountToken);
    return true;
  } catch {
    return false;
  }
}

export async function testPlexServerConnection(serverUrl: string, serverToken: string): Promise<boolean> {
  try {
    await plexFetch(`${serverUrl.replace(/\/+$/, "")}/identity`, serverToken);
    return true;
  } catch {
    return false;
  }
}

interface PlexMetadataGuid {
  id: string;
}

interface PlexMetadataItem {
  ratingKey: string;
  guid: string;
  title: string;
  year?: number;
  type: string;
  viewCount?: number;
  parentTitle?: string;
  grandparentGuid?: string;
  grandparentTitle?: string;
  parentIndex?: number;
  index?: number;
  Guid?: PlexMetadataGuid[];
}

interface PlexMetadataContainer {
  MediaContainer: { Metadata?: PlexMetadataItem[] };
}

export async function getPlexAccountWatchlist(accountToken: string): Promise<PlexWatchlistItem[]> {
  const data = await plexFetch<PlexMetadataContainer>(
    `${PLEX_METADATA_BASE_URL}/library/sections/watchlist/all`,
    accountToken,
  );

  return (data.MediaContainer.Metadata ?? [])
    .filter((item) => item.type === "movie" || item.type === "show")
    .map((item) => ({
      ratingKey: item.ratingKey,
      guid: item.guid,
      title: item.title,
      year: item.year ?? null,
      type: item.type as PlexMediaType,
      externalGuids: (item.Guid ?? []).map((g) => g.id),
    }));
}

export async function getPlexServerWatchedMovies(
  serverUrl: string,
  serverToken: string,
): Promise<PlexWatchedMovie[]> {
  const data = await plexFetch<PlexMetadataContainer>(
    `${serverUrl.replace(/\/+$/, "")}/library/all?type=1`,
    serverToken,
  );

  return (data.MediaContainer.Metadata ?? [])
    .filter((item) => (item.viewCount ?? 0) > 0)
    .map((item) => ({
      guid: item.guid,
      externalGuids: (item.Guid ?? []).map((g) => g.id),
      title: item.title,
      year: item.year ?? null,
    }));
}

export async function getPlexServerWatchedEpisodes(
  serverUrl: string,
  serverToken: string,
): Promise<PlexWatchedEpisode[]> {
  const data = await plexFetch<PlexMetadataContainer>(
    `${serverUrl.replace(/\/+$/, "")}/library/all?type=4`,
    serverToken,
  );

  return (data.MediaContainer.Metadata ?? [])
    .filter((item) => (item.viewCount ?? 0) > 0 && item.grandparentGuid)
    .map((item) => ({
      showGuid: item.grandparentGuid!,
      showExternalGuids: (item.Guid ?? []).map((g) => g.id),
      showTitle: item.grandparentTitle ?? "",
      season: item.parentIndex ?? 0,
      episode: item.index ?? 0,
    }));
}

export async function findPlexDiscoverItemByTmdbId(
  accountToken: string,
  tmdbId: number,
  type: PlexMediaType,
): Promise<string | null> {
  try {
    const data = await plexFetch<PlexMetadataContainer>(
      `${PLEX_DISCOVER_BASE_URL}/library/all?guid=${encodeURIComponent(`tmdb://${tmdbId}`)}&type=${type === "movie" ? 1 : 2}`,
      accountToken,
    );
    const match = data.MediaContainer.Metadata?.[0];
    return match?.ratingKey ?? null;
  } catch {
    return null;
  }
}

export async function addToPlexAccountWatchlist(accountToken: string, ratingKey: string): Promise<void> {
  await plexFetch(
    `${PLEX_DISCOVER_BASE_URL}/actions/addToWatchlist?ratingKey=${encodeURIComponent(ratingKey)}`,
    accountToken,
    { method: "PUT" },
  );
}
