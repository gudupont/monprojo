export interface SonarrSeriesLookup {
  tmdbId: number;
  tvdbId: number;
  title: string;
  year: number;
  titleSlug: string;
  images: { coverType: string; remoteUrl?: string; url?: string }[];
}

export interface SonarrDefaults {
  qualityProfileId: number;
  rootFolderPath: string;
}

async function sonarrFetch<T>(
  url: string,
  apiKey: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${url.replace(/\/+$/, "")}/api/v3${path}`, {
    ...init,
    headers: {
      "X-Api-Key": apiKey,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`Erreur Sonarr (${response.status}) sur ${path}`);
  }
  return response.json() as Promise<T>;
}

export async function testSonarrConnection(url: string, apiKey: string): Promise<boolean> {
  try {
    await sonarrFetch(url, apiKey, "/system/status");
    return true;
  } catch {
    return false;
  }
}

export async function lookupSeriesByExistingId(
  url: string,
  apiKey: string,
  tmdbId: number,
): Promise<boolean> {
  // Sonarr's /series endpoint ignores the tmdbId query param (unlike Radarr's /movie),
  // so the full list must be fetched and filtered client-side.
  const results = await sonarrFetch<{ tmdbId: number }[]>(url, apiKey, "/series");
  return results.some((series) => series.tmdbId === tmdbId);
}

export async function getSonarrDefaults(url: string, apiKey: string): Promise<SonarrDefaults> {
  const [qualityProfiles, rootFolders] = await Promise.all([
    sonarrFetch<{ id: number }[]>(url, apiKey, "/qualityprofile"),
    sonarrFetch<{ path: string }[]>(url, apiKey, "/rootfolder"),
  ]);

  if (qualityProfiles.length === 0) {
    throw new Error("Aucun profil de qualité configuré sur l'instance Sonarr");
  }
  if (rootFolders.length === 0) {
    throw new Error("Aucun dossier racine configuré sur l'instance Sonarr");
  }

  return {
    qualityProfileId: qualityProfiles[0].id,
    rootFolderPath: rootFolders[0].path,
  };
}

export async function lookupSeriesForAdd(
  url: string,
  apiKey: string,
  tmdbId: number,
): Promise<SonarrSeriesLookup> {
  const results = await sonarrFetch<SonarrSeriesLookup[]>(
    url,
    apiKey,
    `/series/lookup?term=tmdb:${tmdbId}`,
  );
  const series = Array.isArray(results) ? results[0] : results;
  if (!series) {
    throw new Error("Série introuvable sur Sonarr");
  }
  return series;
}

export async function addSeriesToSonarr(
  url: string,
  apiKey: string,
  series: SonarrSeriesLookup,
  qualityProfileId: number,
  rootFolderPath: string,
): Promise<void> {
  await sonarrFetch(url, apiKey, "/series", {
    method: "POST",
    body: JSON.stringify({
      title: series.title,
      tmdbId: series.tmdbId,
      tvdbId: series.tvdbId,
      year: series.year,
      titleSlug: series.titleSlug,
      images: series.images,
      qualityProfileId,
      rootFolderPath,
      seriesType: "standard",
      monitored: true,
      addOptions: { monitor: "all" },
    }),
  });
}
