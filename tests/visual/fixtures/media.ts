import type { PrismaClient } from "@prisma/client";

const TEST_TMDB_ID = 999000001;

// Le mock TMDb (mock-tmdb-server.ts) renvoie toujours un payload de recherche, pas un
// payload de détail — inoffensif car ce fixture est disposable : getOrRefreshMedia ne va
// jamais chercher de données fraîches (le média est déjà en cache avant chaque test).
export async function createVisualMedia(db: PrismaClient) {
  // Auto-guérison : si un run précédent a crashé avant son afterAll, la ligne
  // avec ce tmdbId (@unique) peut encore exister et ferait échouer le create
  // suivant (Prisma P2002). On la supprime d'abord si présente.
  await db.media.deleteMany({ where: { tmdbId: TEST_TMDB_ID } });
  return db.media.create({
    data: {
      tmdbId: TEST_TMDB_ID,
      type: "TV",
      title: "Visual QA — Série de test",
      poster: null,
      overview: "Série fictive utilisée uniquement pour les tests de régression visuelle.",
      releaseDate: "2020-01-01",
      tmdbRating: 7.5,
      genres: "Drame",
      seasonsJson: JSON.stringify([
        { season: 1, episodeCount: 1, episodes: [{ episode: 1, title: "Pilote", airDate: "2020-01-01" }] },
      ]),
      episodeRuntimeMinutes: 42,
      cachedAt: new Date(),
    },
  });
}

export async function deleteVisualMedia(db: PrismaClient, mediaId: string | undefined): Promise<void> {
  if (!mediaId) return;
  await db.episodeWatch.deleteMany({ where: { mediaId } });
  await db.watchlistItem.deleteMany({ where: { mediaId } });
  await db.planEntry.deleteMany({ where: { mediaId } });
  await db.media.delete({ where: { id: mediaId } });
}
