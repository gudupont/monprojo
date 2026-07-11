import AdmZip from "adm-zip";
import { parse } from "csv-parse/sync";
import { db } from "@/lib/db";
import { searchMedia, getSeasonEpisodes, type TmdbSearchResult } from "@/lib/tmdb";
import { getOrRefreshMedia } from "@/lib/actions/media";
import { parseSeasons, totalEpisodes, type SeasonSummary } from "@/lib/progress";

const REQUIRED_CSV_FILES = [
  "followed_tv_show.csv",
  "user_tv_show_data.csv",
  "show_seen_episode_latest.csv",
  "seen_episode_source.csv",
  "watched_on_episode.csv",
  "rewatched_episode.csv",
] as const;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class TvtimeZipError extends Error {}

export function readZipCsvs(zipBuffer: Buffer): Record<string, Record<string, string>[]> {
  let zip: AdmZip;
  try {
    zip = new AdmZip(zipBuffer);
  } catch (err) {
    throw new TvtimeZipError(`Zip illisible: ${(err as Error).message}`);
  }

  const entries = zip.getEntries();
  const csvs: Record<string, Record<string, string>[]> = {};

  for (const name of REQUIRED_CSV_FILES) {
    const entry = entries.find((e) => e.entryName.endsWith(name));
    if (!entry) {
      throw new TvtimeZipError(`Fichier manquant dans le zip: ${name}`);
    }
    const content = entry.getData().toString("utf-8");
    csvs[name] = parse(content, { columns: true, skip_empty_lines: true });
  }

  return csvs;
}

function parseTvtimeTitle(rawName: string): { title: string; year: number | null } {
  const match = rawName.match(/^(.*)\s\((\d{4})\)$/);
  if (match) {
    return { title: match[1].trim(), year: Number(match[2]) };
  }
  return { title: rawName.trim(), year: null };
}

function pickBestMatch(results: TmdbSearchResult[], year: number | null): TmdbSearchResult | null {
  const tvResults = results.filter((r) => r.type === "tv");
  if (tvResults.length === 0) return null;
  if (year !== null) {
    const yearMatch = tvResults.find((r) => r.releaseDate?.startsWith(String(year)));
    if (yearMatch) return yearMatch;
  }
  return tvResults[0];
}

interface DetailedWatch {
  season: number;
  episode: number;
  watchedAt: Date;
}

function indexDetailedWatches(
  csvs: Record<string, Record<string, string>[]>
): Map<string, DetailedWatch[]> {
  const bySeries = new Map<string, Map<string, Date>>();

  for (const file of ["seen_episode_source.csv", "watched_on_episode.csv", "rewatched_episode.csv"] as const) {
    for (const row of csvs[file]) {
      const name = row.tv_show_name;
      const season = Number(row.episode_season_number);
      const episode = Number(row.episode_number);
      const createdAt = new Date(row.created_at);
      if (!name || Number.isNaN(season) || Number.isNaN(episode) || Number.isNaN(createdAt.getTime())) {
        continue;
      }

      if (!bySeries.has(name)) bySeries.set(name, new Map());
      const episodeMap = bySeries.get(name)!;
      const key = `${season}:${episode}`;
      const existing = episodeMap.get(key);
      if (!existing || createdAt < existing) {
        episodeMap.set(key, createdAt);
      }
    }
  }

  const result = new Map<string, DetailedWatch[]>();
  for (const [name, episodeMap] of bySeries) {
    result.set(
      name,
      Array.from(episodeMap.entries()).map(([key, watchedAt]) => {
        const [season, episode] = key.split(":").map(Number);
        return { season, episode, watchedAt };
      })
    );
  }
  return result;
}

async function orderedEpisodes(tmdbId: number, seasonsJson: string | null): Promise<{ season: number; episode: number }[]> {
  let seasons: SeasonSummary[] = parseSeasons(seasonsJson);

  seasons = await Promise.all(
    seasons.map(async (s) => {
      if (Array.isArray(s.episodes) && s.episodes.length > 0) return s;
      const episodes = await getSeasonEpisodes(tmdbId, s.season);
      return { ...s, episodes };
    })
  );

  const ordered: { season: number; episode: number }[] = [];
  for (const season of seasons.sort((a, b) => a.season - b.season)) {
    const episodes = (season.episodes ?? []).slice().sort((a, b) => a.episode - b.episode);
    for (const ep of episodes) {
      ordered.push({ season: season.season, episode: ep.episode });
    }
  }
  return ordered;
}

export interface SeriesReport {
  tvtimeName: string;
  matched: boolean;
  tmdbTitle?: string;
  method: "detailed" | "approximated" | "none";
  episodesImported: number;
  status?: "TO_WATCH" | "WATCHING" | "WATCHED";
}

export interface TvtimeImportReport {
  matched: number;
  unmatched: number;
  series: SeriesReport[];
}

export async function runTvtimeImport(
  profileId: string,
  zipBuffer: Buffer,
  onProgress?: (progress: { processed: number; total: number }) => void | Promise<void>
): Promise<TvtimeImportReport> {
  const csvs = readZipCsvs(zipBuffer);
  const detailedWatches = indexDetailedWatches(csvs);

  const nbEpisodesSeenByName = new Map<string, { count: number; updatedAt: string | null }>();
  for (const row of csvs["user_tv_show_data.csv"]) {
    const count = Number(row.nb_episodes_seen);
    nbEpisodesSeenByName.set(row.tv_show_name, {
      count: Number.isNaN(count) ? 0 : count,
      updatedAt: null,
    });
  }

  const report: SeriesReport[] = [];
  const followed = csvs["followed_tv_show.csv"];

  for (let i = 0; i < followed.length; i++) {
    const row = followed[i];
    const tvtimeName = row.tv_show_name;
    const { title, year } = parseTvtimeTitle(tvtimeName);

    let results: TmdbSearchResult[];
    try {
      results = await searchMedia(title);
    } catch {
      report.push({ tvtimeName, matched: false, method: "none", episodesImported: 0 });
      await onProgress?.({ processed: i + 1, total: followed.length });
      continue;
    }
    await sleep(250);

    const best = pickBestMatch(results, year);
    if (!best) {
      report.push({ tvtimeName, matched: false, method: "none", episodesImported: 0 });
      await onProgress?.({ processed: i + 1, total: followed.length });
      continue;
    }

    const media = await getOrRefreshMedia(best.tmdbId, "tv");
    await sleep(250);

    const episodes = await orderedEpisodes(media.tmdbId, media.seasonsJson);
    const total = totalEpisodes(parseSeasons(media.seasonsJson));

    let watches: { season: number; episode: number; watchedAt: Date }[] = [];
    let method: SeriesReport["method"] = "none";

    const detailed = detailedWatches.get(tvtimeName);
    if (detailed && detailed.length > 0) {
      watches = detailed;
      method = "detailed";
    } else {
      const aggregate = nbEpisodesSeenByName.get(tvtimeName);
      const nbSeen = aggregate?.count ?? 0;
      if (nbSeen > 0) {
        const watchedAt = new Date(row.updated_at || Date.now());
        watches = episodes.slice(0, nbSeen).map((e) => ({ ...e, watchedAt }));
        method = "approximated";
      }
    }

    for (const w of watches) {
      await db.episodeWatch.upsert({
        where: {
          mediaId_profileId_season_episode: {
            mediaId: media.id,
            profileId,
            season: w.season,
            episode: w.episode,
          },
        },
        create: {
          mediaId: media.id,
          profileId,
          season: w.season,
          episode: w.episode,
          watchedAt: w.watchedAt,
        },
        update: {
          watchedAt: w.watchedAt,
        },
      });
    }

    const archived = row.archived === "1" || row.archived === "true";
    const watchedCount = watches.length;
    let status: SeriesReport["status"];
    if (archived) {
      status = "WATCHED";
    } else if (total > 0 && watchedCount >= total) {
      status = "WATCHED";
    } else if (watchedCount > 0) {
      status = "WATCHING";
    } else {
      status = "TO_WATCH";
    }

    await db.watchlistItem.upsert({
      where: {
        mediaId_profileId: {
          mediaId: media.id,
          profileId,
        },
      },
      create: {
        mediaId: media.id,
        profileId,
        status,
        watchedAt: status === "WATCHED" ? new Date() : null,
      },
      update: {
        status,
        watchedAt: status === "WATCHED" ? new Date() : null,
      },
    });

    report.push({
      tvtimeName,
      matched: true,
      tmdbTitle: media.title,
      method,
      episodesImported: watchedCount,
      status,
    });

    await onProgress?.({ processed: i + 1, total: followed.length });
  }

  const matched = report.filter((r) => r.matched);
  const unmatched = report.filter((r) => !r.matched);

  return { matched: matched.length, unmatched: unmatched.length, series: report };
}
