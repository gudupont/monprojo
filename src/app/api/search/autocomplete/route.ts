import { NextRequest, NextResponse } from "next/server";
import { searchMedia } from "@/lib/tmdb";

const MAX_RESULTS = 8;

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";

  if (q.trim().length < 3) {
    return NextResponse.json([]);
  }

  try {
    const results = await searchMedia(q);
    const suggestions = results.slice(0, MAX_RESULTS).map((item) => ({
      tmdbId: item.tmdbId,
      type: item.type,
      title: item.title,
      poster: item.poster,
      releaseDate: item.releaseDate,
      tmdbRating: item.tmdbRating,
    }));

    return NextResponse.json(suggestions);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Erreur recherche TMDb" },
      { status: 500 },
    );
  }
}
