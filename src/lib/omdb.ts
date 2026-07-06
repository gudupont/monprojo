const OMDB_BASE_URL = "https://www.omdbapi.com/";

function getApiKey(): string {
  const apiKey = process.env.OMDB_API_KEY;
  if (!apiKey) {
    throw new Error("OMDB_API_KEY n'est pas configurée");
  }
  return apiKey;
}

interface OmdbResponse {
  imdbRating?: string;
  Response: "True" | "False";
}

/**
 * Fallback utilisé quand TMDb ne fournit pas de note IMDb exploitable.
 */
export async function getImdbRating(imdbId: string): Promise<number | null> {
  const url = new URL(OMDB_BASE_URL);
  url.searchParams.set("apikey", getApiKey());
  url.searchParams.set("i", imdbId);

  const response = await fetch(url);
  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as OmdbResponse;
  if (data.Response === "False" || !data.imdbRating || data.imdbRating === "N/A") {
    return null;
  }

  return Number.parseFloat(data.imdbRating);
}
