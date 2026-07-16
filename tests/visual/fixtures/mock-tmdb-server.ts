import http from "node:http";

export const MOCK_TMDB_PORT = 4599;

// Mock recherche uniquement — si un futur test a besoin d'un endpoint /tv/{id} ou /find, router par chemin ici.
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

export function startMockTmdbServer(port: number = MOCK_TMDB_PORT): Promise<{ close: () => Promise<void> }> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((_req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(SEARCH_MULTI_RESPONSE));
    });
    server.once("error", reject);
    server.listen(port, () => {
      resolve({
        close: () => new Promise<void>((res2) => server.close(() => res2())),
      });
    });
  });
}
