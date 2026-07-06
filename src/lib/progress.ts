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

export function parseGenres(genres: string | null): string[] {
  return genres ? genres.split(",").filter(Boolean) : [];
}
