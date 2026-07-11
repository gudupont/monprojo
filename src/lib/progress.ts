export interface EpisodeSummary {
  episode: number;
  title: string;
  airDate: string | null;
}

export interface SeasonSummary {
  season: number;
  episodeCount: number;
  episodes?: EpisodeSummary[];
}

export function parseSeasons(seasonsJson: string | null): SeasonSummary[] {
  if (!seasonsJson) return [];
  try {
    const parsed = JSON.parse(seasonsJson);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function totalEpisodes(seasons: SeasonSummary[]): number {
  return seasons.reduce((sum, s) => sum + s.episodeCount, 0);
}

export function findDefaultSeason(
  seasons: SeasonSummary[],
  watchedCounts: Map<number, number>
): SeasonSummary | undefined {
  const sorted = [...seasons].sort((a, b) => a.season - b.season);
  const firstUnwatched = sorted.find((s) => (watchedCounts.get(s.season) ?? 0) < s.episodeCount);
  return firstUnwatched ?? sorted[sorted.length - 1];
}

export function parseGenres(genres: string | null): string[] {
  return genres ? genres.split(",").filter(Boolean) : [];
}

export function seasonEpisodeNumbers(season: SeasonSummary): number[] {
  if (season.episodes && season.episodes.length > 0) {
    return season.episodes.map((e) => e.episode);
  }
  return Array.from({ length: season.episodeCount }, (_, i) => i + 1);
}

export function selectReleasedEpisodes(
  seasons: SeasonSummary[],
  today: string,
): { season: number; episode: number }[] {
  return seasons.flatMap((season) =>
    (season.episodes ?? [])
      .filter((episode) => episode.airDate !== null && episode.airDate <= today)
      .map((episode) => ({ season: season.season, episode: episode.episode })),
  );
}
