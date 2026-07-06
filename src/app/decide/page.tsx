import { redirect } from "next/navigation";
import { getActiveProfile } from "@/lib/session";
import { db } from "@/lib/db";
import { computeProgressPercent } from "@/lib/media-progress";
import { parseGenres } from "@/lib/progress";
import { DecideClient, type DecideCandidate } from "@/components/decide-client";

export default async function DecidePage() {
  const profile = await getActiveProfile();
  if (!profile) redirect("/profiles");

  const items = await db.watchlistItem.findMany({
    where: { profileId: profile.id },
    include: { media: true },
    orderBy: { addedAt: "desc" },
  });

  const candidates: DecideCandidate[] = await Promise.all(
    items.map(async (item) => {
      const progress = await computeProgressPercent(item.media, profile.id, item.status);
      const year = item.media.releaseDate?.slice(0, 4);
      return {
        id: item.id,
        tmdbId: item.media.tmdbId,
        type: item.media.type === "MOVIE" ? "movie" : "tv",
        title: item.media.title,
        poster: item.media.poster,
        genres: parseGenres(item.media.genres),
        metaLine: [item.media.type === "MOVIE" ? "Film" : "Série", year].filter(Boolean).join(" · "),
        isDone: progress >= 100,
      };
    }),
  );

  return (
    <div className="px-4 pt-5 md:px-10 md:pt-0">
      <h1 className="mb-1.5 font-heading text-[30px] text-mp-text md:text-[38px]">Décide pour moi</h1>
      <p className="mb-6 text-sm text-mp-text-dim">Filtre selon ton envie, puis laisse le hasard choisir.</p>
      <DecideClient candidates={candidates} />
    </div>
  );
}
