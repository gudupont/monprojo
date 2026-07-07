export interface RadarrMovieLookup {
  tmdbId: number;
  title: string;
  year: number;
  titleSlug: string;
  images: { coverType: string; remoteUrl?: string; url?: string }[];
  tmdbRating?: unknown;
}

export interface RadarrDefaults {
  qualityProfileId: number;
  rootFolderPath: string;
}

async function radarrFetch<T>(
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
    throw new Error(`Erreur Radarr (${response.status}) sur ${path}`);
  }
  return response.json() as Promise<T>;
}

export async function testRadarrConnection(url: string, apiKey: string): Promise<boolean> {
  try {
    await radarrFetch(url, apiKey, "/system/status");
    return true;
  } catch {
    return false;
  }
}

export async function lookupMovieByExistingId(
  url: string,
  apiKey: string,
  tmdbId: number,
): Promise<boolean> {
  const results = await radarrFetch<{ id: number }[]>(url, apiKey, `/movie?tmdbId=${tmdbId}`);
  return results.length > 0;
}

export async function getRadarrDefaults(url: string, apiKey: string): Promise<RadarrDefaults> {
  const [qualityProfiles, rootFolders] = await Promise.all([
    radarrFetch<{ id: number }[]>(url, apiKey, "/qualityprofile"),
    radarrFetch<{ path: string }[]>(url, apiKey, "/rootfolder"),
  ]);

  if (qualityProfiles.length === 0) {
    throw new Error("Aucun profil de qualité configuré sur l'instance Radarr");
  }
  if (rootFolders.length === 0) {
    throw new Error("Aucun dossier racine configuré sur l'instance Radarr");
  }

  return {
    qualityProfileId: qualityProfiles[0].id,
    rootFolderPath: rootFolders[0].path,
  };
}

export async function lookupMovieForAdd(
  url: string,
  apiKey: string,
  tmdbId: number,
): Promise<RadarrMovieLookup> {
  const results = await radarrFetch<RadarrMovieLookup[]>(
    url,
    apiKey,
    `/movie/lookup/tmdb?tmdbId=${tmdbId}`,
  );
  const movie = Array.isArray(results) ? results[0] : results;
  if (!movie) {
    throw new Error("Film introuvable sur Radarr");
  }
  return movie;
}

export async function addMovieToRadarr(
  url: string,
  apiKey: string,
  movie: RadarrMovieLookup,
  qualityProfileId: number,
  rootFolderPath: string,
): Promise<void> {
  await radarrFetch(url, apiKey, "/movie", {
    method: "POST",
    body: JSON.stringify({
      title: movie.title,
      tmdbId: movie.tmdbId,
      year: movie.year,
      titleSlug: movie.titleSlug,
      images: movie.images,
      qualityProfileId,
      rootFolderPath,
      monitored: true,
      addOptions: { searchForMovie: true },
    }),
  });
}
