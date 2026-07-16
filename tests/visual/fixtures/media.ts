import type { PrismaClient } from "@prisma/client";

const TEST_TMDB_ID = 999000001;

export async function createVisualMedia(db: PrismaClient) {
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
