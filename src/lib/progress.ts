export interface SeasonSummary {
  season: number;
  episodeCount: number;
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
