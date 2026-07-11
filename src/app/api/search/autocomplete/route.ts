import { NextRequest, NextResponse } from "next/server";
import { searchMedia } from "@/lib/tmdb";
import { getActiveProfile } from "@/lib/session";
import { db } from "@/lib/db";

const MAX_RESULTS = 8;

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";

  if (q.trim().length < 3) {
    return NextResponse.json([]);
  }

  try {
    const results = await searchMedia(q);
    const sliced = results.slice(0, MAX_RESULTS);

    const profile = await getActiveProfile();
    let watchlistTmdbIds = new Set<number>();
    if (profile) {
      const items = await db.watchlistItem.findMany({
        where: {
          profileId: profile.id,
          media: { tmdbId: { in: sliced.map((item) => item.tmdbId) } },
        },
        select: { media: { select: { tmdbId: true } } },
      });
      watchlistTmdbIds = new Set(items.map((item) => item.media.tmdbId));
    }

    const suggestions = sliced.map((item) => ({
      tmdbId: item.tmdbId,
      type: item.type,
      title: item.title,
      poster: item.poster,
      releaseDate: item.releaseDate,
      tmdbRating: item.tmdbRating,
      inWatchlist: watchlistTmdbIds.has(item.tmdbId),
    }));

    return NextResponse.json(suggestions);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Erreur recherche TMDb" },
      { status: 500 },
    );
  }
}
