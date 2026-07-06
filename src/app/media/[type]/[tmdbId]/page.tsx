import Image from "next/image";
import { notFound } from "next/navigation";
import { Bookmark, Check } from "lucide-react";
import { getMediaDetail } from "@/lib/tmdb";
import { getOrRefreshMedia } from "@/lib/actions/media";
import { toggleWatchlist, toggleMovieWatched } from "@/lib/actions/watchlist";
import { toggleEpisodeWatched } from "@/lib/actions/episode";
import { getActiveProfile } from "@/lib/session";
import { db } from "@/lib/db";
import { parseSeasons, parseGenres } from "@/lib/progress";
import { Button } from "@/components/ui/button";
import { PlanDialog } from "@/components/plan-dialog";
import { BackLink } from "@/components/back-link";

export default async function MediaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string; tmdbId: string }>;
  searchParams: Promise<{ season?: string }>;
}) {
  const { type, tmdbId } = await params;
  if (type !== "movie" && type !== "tv") notFound();

  const tmdbIdNumber = Number.parseInt(tmdbId, 10);
  if (Number.isNaN(tmdbIdNumber)) notFound();

  const [media, detail, profile] = await Promise.all([
    getOrRefreshMedia(tmdbIdNumber, type),
    getMediaDetail(tmdbIdNumber, type),
    getActiveProfile(),
  ]);

  const watchlistItem = profile
    ? await db.watchlistItem.findUnique({
        where: { mediaId_profileId: { mediaId: media.id, profileId: profile.id } },
      })
    : null;

  const seasons = parseSeasons(media.seasonsJson);
  const genres = parseGenres(media.genres);
  const { season: seasonParam } = await searchParams;
  const activeSeason = seasons.find((s) => s.season === Number(seasonParam)) ?? seasons[0];

  const episodeWatches =
    profile && type === "tv"
      ? await db.episodeWatch.findMany({ where: { mediaId: media.id, profileId: profile.id } })
      : [];
  const watchedSet = new Set(episodeWatches.map((e) => `${e.season}-${e.episode}`));

  return (
    <div className="px-4 pt-4 pb-10 md:px-10 md:pt-6">
      <BackLink />

      <div className="mt-4 flex flex-wrap gap-7 rounded-[20px] border border-mp-border bg-mp-surface p-6 md:flex-nowrap md:p-10">
        <div className="relative aspect-[2/3] w-24 shrink-0 overflow-hidden rounded-xl bg-mp-surface-2 md:w-[150px]">
          {media.poster ? (
            <Image src={media.poster} alt={media.title} fill className="object-cover" sizes="150px" />
          ) : null}
        </div>

        <div>
          <h1 className="mb-2 font-heading text-[28px] text-mp-text md:text-[38px]">{media.title}</h1>
          <div className="mb-3.5 flex flex-wrap gap-2.5">
            <span className="rounded-full border border-mp-border px-3 py-1 text-xs font-semibold text-mp-text-dim">
              {type === "movie" ? "Film" : "Série"}
            </span>
            {genres.slice(0, 2).map((g) => (
              <span key={g} className="rounded-full border border-mp-border px-3 py-1 text-xs font-semibold text-mp-text-dim">
                {g}
              </span>
            ))}
            {media.releaseDate && (
              <span className="rounded-full border border-mp-border px-3 py-1 text-xs font-semibold text-mp-text-dim">
                {media.releaseDate.slice(0, 4)}
              </span>
            )}
            {media.tmdbRating ? (
              <span className="rounded-full border border-mp-border px-3 py-1 text-xs font-bold text-mp-accent">
                ★ {media.tmdbRating.toFixed(1)}
              </span>
            ) : null}
          </div>
          <p className="mb-4.5 max-w-xl text-[15px] leading-relaxed text-mp-text-dim">{media.overview}</p>

          <div className="flex flex-wrap gap-3">
            <form action={toggleWatchlist.bind(null, media.id)}>
              <Button
                type="submit"
                variant={watchlistItem ? "default" : "outline"}
                className="gap-2 rounded-full"
              >
                <Bookmark size={16} />
                {watchlistItem ? "Dans ma liste" : "Ajouter à ma liste"}
              </Button>
            </form>
            {type === "movie" && (
              <form action={toggleMovieWatched.bind(null, media.id)}>
                <Button
                  type="submit"
                  variant={watchlistItem?.status === "WATCHED" ? "default" : "secondary"}
                  className="gap-2 rounded-full"
                >
                  <Check size={16} />
                  {watchlistItem?.status === "WATCHED" ? "Vu" : "Marquer comme vu"}
                </Button>
              </form>
            )}
            <PlanDialog mediaId={media.id} title={media.title} />
          </div>
        </div>
      </div>

      {type === "tv" && seasons.length > 0 && activeSeason && (
        <div className="mt-8">
          <div className="mb-4 flex gap-2 overflow-x-auto">
            {seasons.map((s) => (
              <a
                key={s.season}
                href={`?season=${s.season}`}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold ${
                  s.season === activeSeason.season
                    ? "bg-mp-accent text-mp-accent-ink"
                    : "border border-mp-border bg-mp-surface text-mp-text-dim"
                }`}
              >
                Saison {s.season}
              </a>
            ))}
          </div>
          <div className="flex flex-col gap-2.5">
            {Array.from({ length: activeSeason.episodeCount }, (_, i) => i + 1).map((ep) => {
              const watched = watchedSet.has(`${activeSeason.season}-${ep}`);
              return (
                <form key={ep} action={toggleEpisodeWatched.bind(null, media.id, activeSeason.season, ep)}>
                  <button
                    type="submit"
                    className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left ${
                      watched ? "border-mp-accent/25 bg-mp-accent/10" : "border-mp-border bg-mp-surface"
                    }`}
                  >
                    <span
                      className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full ${
                        watched ? "bg-mp-accent text-mp-accent-ink" : "border border-mp-text-faint"
                      }`}
                    >
                      {watched && <Check size={13} strokeWidth={3} />}
                    </span>
                    <span className="text-sm text-mp-text">Épisode {ep}</span>
                  </button>
                </form>
              );
            })}
          </div>
        </div>
      )}

      {detail.cast.length > 0 && (
        <div className="mt-9">
          <h2 className="mb-3 font-heading text-2xl text-mp-text">Distribution</h2>
          <p className="max-w-xl text-[15px] leading-relaxed text-mp-text-dim">{detail.cast.join(" · ")}</p>
        </div>
      )}
    </div>
  );
}
