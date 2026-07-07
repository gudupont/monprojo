const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

export type TmdbMediaType = "movie" | "tv";

export interface TmdbSearchResult {
  tmdbId: number;
  type: TmdbMediaType;
  title: string;
  poster: string | null;
  overview: string | null;
  releaseDate: string | null;
  tmdbRating: number | null;
}

export interface TmdbEpisodeSummary {
  episode: number;
  title: string;
  airDate: string | null;
}

export interface TmdbSeasonSummary {
  season: number;
  episodeCount: number;
  episodes?: TmdbEpisodeSummary[];
}

export interface TmdbMediaDetail extends TmdbSearchResult {
  imdbId: string | null;
  cast: string[];
  genres: string[];
  seasons: TmdbSeasonSummary[] | null;
}

function getApiKey(): string {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error("TMDB_API_KEY n'est pas configurée");
  }
  return apiKey;
}

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${TMDB_BASE_URL}${path}`);
  url.searchParams.set("api_key", getApiKey());
  url.searchParams.set("language", "fr-FR");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Erreur TMDb (${response.status}) sur ${path}`);
  }
  return response.json() as Promise<T>;
}

interface TmdbMultiSearchItem {
  id: number;
  media_type: "movie" | "tv" | "person";
  title?: string;
  name?: string;
  poster_path: string | null;
  overview: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number | null;
}

export async function searchMedia(query: string): Promise<TmdbSearchResult[]> {
  const data = await tmdbFetch<{ results: TmdbMultiSearchItem[] }>("/search/multi", { query });

  return data.results
    .filter((item): item is TmdbMultiSearchItem & { media_type: "movie" | "tv" } => item.media_type !== "person")
    .map((item) => ({
      tmdbId: item.id,
      type: item.media_type,
      title: item.title ?? item.name ?? "Titre inconnu",
      poster: item.poster_path ? `${TMDB_IMAGE_BASE_URL}${item.poster_path}` : null,
      overview: item.overview,
      releaseDate: item.release_date ?? item.first_air_date ?? null,
      tmdbRating: item.vote_average,
    }));
}

interface TmdbDetailResponse {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  overview: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number | null;
  external_ids?: { imdb_id: string | null };
  credits?: { cast: { name: string }[] };
  genres?: { id: number; name: string }[];
  seasons?: { season_number: number; episode_count: number }[];
}

export async function getMediaDetail(tmdbId: number, type: TmdbMediaType): Promise<TmdbMediaDetail> {
  const data = await tmdbFetch<TmdbDetailResponse>(`/${type}/${tmdbId}`, {
    append_to_response: "external_ids,credits",
  });

  let seasons: TmdbSeasonSummary[] | null = null;
  if (type === "tv") {
    const seasonSummaries = (data.seasons ?? [])
      .filter((s) => s.season_number > 0)
      .map((s) => ({ season: s.season_number, episodeCount: s.episode_count }));

    seasons = await Promise.all(
      seasonSummaries.map(async (s) => {
        try {
          const episodes = await getSeasonEpisodes(tmdbId, s.season);
          return { ...s, episodes };
        } catch {
          return s;
        }
      })
    );
  }

  return {
    tmdbId: data.id,
    type,
    title: data.title ?? data.name ?? "Titre inconnu",
    poster: data.poster_path ? `${TMDB_IMAGE_BASE_URL}${data.poster_path}` : null,
    overview: data.overview,
    releaseDate: data.release_date ?? data.first_air_date ?? null,
    tmdbRating: data.vote_average,
    imdbId: data.external_ids?.imdb_id ?? null,
    cast: data.credits?.cast?.slice(0, 10).map((c) => c.name) ?? [],
    genres: data.genres?.map((g) => g.name) ?? [],
    seasons,
  };
}

interface TmdbSeasonDetailResponse {
  episodes?: { episode_number: number; name: string; air_date?: string | null }[];
}

export async function getSeasonEpisodes(tmdbId: number, season: number): Promise<TmdbEpisodeSummary[]> {
  const data = await tmdbFetch<TmdbSeasonDetailResponse>(`/tv/${tmdbId}/season/${season}`);
  return (data.episodes ?? []).map((e) => ({
    episode: e.episode_number,
    title: e.name,
    airDate: e.air_date ? e.air_date : null,
  }));
}

export interface TmdbWatchProvider {
  providerId: number;
  name: string;
  logoPath: string | null;
}

export interface TmdbWatchProviders {
  link: string | null;
  flatrate: TmdbWatchProvider[];
}

interface TmdbWatchProvidersResponse {
  results?: Record<string, { link?: string; flatrate?: { provider_id: number; provider_name: string; logo_path: string | null }[] }>;
}

export async function getWatchProviders(tmdbId: number, type: TmdbMediaType): Promise<TmdbWatchProviders> {
  const data = await tmdbFetch<TmdbWatchProvidersResponse>(`/${type}/${tmdbId}/watch/providers`);
  const fr = data.results?.FR;
  return {
    link: fr?.link ?? null,
    flatrate: (fr?.flatrate ?? []).map((p) => ({
      providerId: p.provider_id,
      name: p.provider_name,
      logoPath: p.logo_path,
    })),
  };
}

interface TmdbProviderListItem {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  display_priorities?: Record<string, number>;
}

interface TmdbProviderListResponse {
  results: TmdbProviderListItem[];
}

let availableProvidersCache: { data: TmdbWatchProvider[]; expiresAt: number } | null = null;
const AVAILABLE_PROVIDERS_TTL_MS = 1000 * 60 * 60 * 24; // 24h

export async function getAvailableProviders(): Promise<TmdbWatchProvider[]> {
  if (availableProvidersCache && Date.now() < availableProvidersCache.expiresAt) {
    return availableProvidersCache.data;
  }

  const [movies, tv] = await Promise.all([
    tmdbFetch<TmdbProviderListResponse>("/watch/providers/movie", { watch_region: "FR" }),
    tmdbFetch<TmdbProviderListResponse>("/watch/providers/tv", { watch_region: "FR" }),
  ]);

  const byId = new Map<number, { item: TmdbProviderListItem; priority: number }>();
  for (const item of [...movies.results, ...tv.results]) {
    const priority = item.display_priorities?.FR;
    if (priority === undefined) continue;
    const existing = byId.get(item.provider_id);
    if (!existing || priority < existing.priority) {
      byId.set(item.provider_id, { item, priority });
    }
  }

  const data = Array.from(byId.values())
    .sort((a, b) => a.priority - b.priority)
    .map(({ item }) => ({
      providerId: item.provider_id,
      name: item.provider_name,
      logoPath: item.logo_path,
    }));

  availableProvidersCache = { data, expiresAt: Date.now() + AVAILABLE_PROVIDERS_TTL_MS };
  return data;
}
