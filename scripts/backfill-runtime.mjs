import { PrismaClient } from "@prisma/client";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
if (!TMDB_API_KEY) {
  console.error("TMDB_API_KEY manquant dans l'env");
  process.exit(1);
}

const db = new PrismaClient();

async function fetchRuntime(tmdbId, type) {
  const path = type === "MOVIE" ? "movie" : "tv";
  const res = await fetch(
    `https://api.themoviedb.org/3/${path}/${tmdbId}?api_key=${TMDB_API_KEY}&language=fr-FR`
  );
  if (!res.ok) throw new Error(`TMDb ${res.status} pour ${type} ${tmdbId}`);
  const data = await res.json();
  return type === "MOVIE"
    ? { runtimeMinutes: data.runtime ?? null }
    : { episodeRuntimeMinutes: data.episode_run_time?.[0] ?? null };
}

async function main() {
  const stale = await db.media.findMany({
    where: {
      OR: [
        { type: "MOVIE", runtimeMinutes: null },
        { type: "TV", episodeRuntimeMinutes: null },
      ],
    },
  });

  console.log(`${stale.length} media a backfiller`);

  for (const media of stale) {
    try {
      const runtime = await fetchRuntime(media.tmdbId, media.type);
      await db.media.update({ where: { id: media.id }, data: runtime });
      console.log(`OK ${media.title}`, runtime);
    } catch (err) {
      console.error(`ECHEC ${media.title}:`, err.message);
    }
  }

  await db.$disconnect();
}

main();
