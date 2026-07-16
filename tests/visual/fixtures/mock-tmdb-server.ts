import http from "node:http";

export const MOCK_TMDB_PORT = 4599;

const SEARCH_MULTI_RESPONSE = {
  results: [
    {
      id: 603,
      media_type: "movie",
      title: "Matrix",
      poster_path: null,
      overview: "Un pirate informatique découvre la vérité sur sa réalité.",
      release_date: "1999-03-30",
      vote_average: 8.2,
    },
    {
      id: 1396,
      media_type: "tv",
      name: "Breaking Bad",
      poster_path: null,
      overview: "Un professeur de chimie bascule dans le trafic de drogue.",
      first_air_date: "2008-01-20",
      vote_average: 8.9,
    },
  ],
};

const TV_DETAIL_RESPONSE = {
  id: 1396,
  name: "Breaking Bad",
  overview: "Un professeur de chimie bascule dans le trafic de drogue.",
  first_air_date: "2008-01-20",
  vote_average: 8.9,
  poster_path: null,
  backdrop_path: null,
  genres: [
    { id: 80, name: "Crime" },
    { id: 18, name: "Drama" },
  ],
  seasons: [
    { season_number: 1, episode_count: 7 },
    { season_number: 2, episode_count: 13 },
  ],
  episode_run_time: [47],
  external_ids: { imdb_id: "tt0903747" },
  credits: {
    cast: [
      {
        id: 17419,
        name: "Bryan Cranston",
        character: "Walter White",
        profile_path: null,
      },
      {
        id: 84497,
        name: "Anna Gunn",
        character: "Skyler White",
        profile_path: null,
      },
    ],
  },
};

export function startMockTmdbServer(port: number = MOCK_TMDB_PORT): Promise<{ close: () => Promise<void> }> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = req.url || "";
      res.writeHead(200, { "Content-Type": "application/json" });

      // Handle /tv/1396 endpoint
      if (url.includes("/tv/1396")) {
        res.end(JSON.stringify(TV_DETAIL_RESPONSE));
      } else {
        // Default to search response
        res.end(JSON.stringify(SEARCH_MULTI_RESPONSE));
      }
    });
    server.once("error", reject);
    server.listen(port, () => {
      resolve({
        close: () => new Promise<void>((res2) => server.close(() => res2())),
      });
    });
  });
}
