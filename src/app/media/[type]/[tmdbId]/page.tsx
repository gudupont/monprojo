import Image from "next/image";
import { notFound } from "next/navigation";
import { Bookmark, Check } from "lucide-react";
import { getMediaDetail, getSeasonEpisodes, type TmdbEpisodeSummary } from "@/lib/tmdb";
import { getOrRefreshMedia } from "@/lib/actions/media";
import { toggleWatchlist, toggleMovieWatched } from "@/lib/actions/watchlist";
import { toggleEpisodeWatched } from "@/lib/actions/episode";
import { getActiveProfile } from "@/lib/session";
import { db } from "@/lib/db";
import { parseSeasons, parseGenres, findDefaultSeason } from "@/lib/progress";
import { computeProgressPercent } from "@/lib/media-progress";
import { getProfileProviders } from "@/lib/actions/provider";
import { getRadarrStatus, checkInRadarr } from "@/lib/actions/radarr";
import { getSonarrStatus, checkInSonarr } from "@/lib/actions/sonarr";
import type { TmdbWatchProviders } from "@/lib/tmdb";
import { Button } from "@/components/ui/button";
import { PlanDialog } from "@/components/plan-dialog";
import { BackLink } from "@/components/back-link";
import { WatchProviders } from "@/components/watch-providers";
import { RadarrButton } from "@/components/radarr-button";
import { SonarrButton } from "@/components/sonarr-button";
import { SeasonSelect } from "@/components/season-select";
import { SeasonWatchButton } from "@/components/season-watch-confirm-modal";

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

  const watchProviders: TmdbWatchProviders = media.watchProvidersJson
    ? JSON.parse(media.watchProvidersJson)
    : { link: null, flatrate: [] };
  const ownedProviderIds = profile ? new Set(await getProfileProviders(profile.id)) : new Set<number>();
  const sortedProviders = [
    ...watchProviders.flatrate.filter((p) => ownedProviderIds.has(p.providerId)),
    ...watchProviders.flatrate.filter((p) => !ownedProviderIds.has(p.providerId)),
  ];
  const episodeWatches =
    profile && type === "tv"
      ? await db.episodeWatch.findMany({ where: { mediaId: media.id, profileId: profile.id } })
      : [];
  const watchedSet = new Set(episodeWatches.map((e) => `${e.season}-${e.episode}`));
  const watchedCounts = new Map<number, number>();
  for (const e of episodeWatches) {
    watchedCounts.set(e.season, (watchedCounts.get(e.season) ?? 0) + 1);
  }

  const { season: seasonParam } = await searchParams;
  const activeSeason =
    seasons.find((s) => s.season === Number(seasonParam)) ??
    findDefaultSeason(seasons, watchedCounts) ??
    seasons[0];

  let episodeTitles: TmdbEpisodeSummary[] = [];
  if (type === "tv" && activeSeason) {
    try {
      episodeTitles = await getSeasonEpisodes(tmdbIdNumber, activeSeason.season);
    } catch {
      episodeTitles = [];
    }
  }
  const titleByEpisode = new Map(episodeTitles.map((e) => [e.episode, e.title]));
  const airDateByEpisode = new Map(episodeTitles.map((e) => [e.episode, e.airDate]));

  function formatAirDate(airDate: string | null | undefined): string {
    if (!airDate) return "N/A";
    const [year, month, day] = airDate.split("-");
    return `${day}/${month}/${year}`;
  }

  const seasonWatchedCount = activeSeason
    ? episodeWatches.filter((e) => e.season === activeSeason.season).length
    : 0;
  const seasonPercent = activeSeason && activeSeason.episodeCount > 0
    ? Math.round((seasonWatchedCount / activeSeason.episodeCount) * 100)
    : 0;
  const seasonFullyWatched = activeSeason ? seasonWatchedCount >= activeSeason.episodeCount : false;

  const previousSeasons = activeSeason ? seasons.filter((s) => s.season < activeSeason.season) : [];
  const previousSeasonsToWatch = previousSeasons
    .filter((s) => episodeWatches.filter((e) => e.season === s.season).length < s.episodeCount)
    .map((s) => ({ season: s.season, episodeNumbers: Array.from({ length: s.episodeCount }, (_, i) => i + 1) }));
  const previousSeasonsToUnwatch = previousSeasons
    .filter((s) => episodeWatches.some((e) => e.season === s.season))
    .map((s) => ({ season: s.season }));

  const globalPercent =
    type === "tv" && profile
      ? await computeProgressPercent(media, profile.id, watchlistItem?.status ?? "TO_WATCH")
      : null;

  const hasRadarrConfig = profile && type === "movie" ? await getRadarrStatus(profile.id) : false;
  const alreadyInRadarr =
    hasRadarrConfig && profile ? await checkInRadarr(profile.id, media.tmdbId) : false;

  const hasSonarrConfig = profile && type === "tv" ? await getSonarrStatus(profile.id) : false;
  const alreadyInSonarr =
    hasSonarrConfig && profile ? await checkInSonarr(profile.id, media.tmdbId) : false;

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
            {hasRadarrConfig && profile && (
              <RadarrButton
                profileId={profile.id}
                tmdbId={media.tmdbId}
                initiallyPresent={alreadyInRadarr}
              />
            )}
            {hasSonarrConfig && profile && (
              <SonarrButton
                profileId={profile.id}
                tmdbId={media.tmdbId}
                initiallyPresent={alreadyInSonarr}
              />
            )}
          </div>
        </div>
      </div>

      <WatchProviders link={watchProviders.link} providers={sortedProviders} />

      {type === "tv" && seasons.length === 0 && (
        <div className="mt-8 rounded-xl border border-mp-border bg-mp-surface p-6 text-sm text-mp-text-dim">
          Aucun détail épisode disponible pour cette série.
        </div>
      )}

      {type === "tv" && seasons.length > 0 && activeSeason && (
        <div className="mt-8">
          {globalPercent !== null && (
            <div className="mb-4 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-mp-surface-2">
                <div className="h-full rounded-full bg-mp-accent" style={{ width: `${globalPercent}%` }} />
              </div>
              <span className="text-xs font-semibold text-mp-text-dim">{globalPercent}% vu au total</span>
            </div>
          )}

          <div className="mb-4">
            <SeasonSelect seasons={seasons} activeSeason={activeSeason.season} />
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-mp-border bg-mp-surface p-4">
            <div className="flex flex-1 items-center gap-3">
              <div className="h-2 flex-1 min-w-[80px] overflow-hidden rounded-full bg-mp-surface-2">
                <div className="h-full rounded-full bg-mp-accent" style={{ width: `${seasonPercent}%` }} />
              </div>
              <span className="text-xs font-semibold text-mp-text-dim">{seasonPercent}%</span>
            </div>
            {seasonFullyWatched ? (
              <SeasonWatchButton
                mediaId={media.id}
                season={activeSeason.season}
                direction="unwatch"
                episodeNumbers={Array.from({ length: activeSeason.episodeCount }, (_, i) => i + 1)}
                previousSeasons={previousSeasonsToUnwatch}
              />
            ) : (
              <SeasonWatchButton
                mediaId={media.id}
                season={activeSeason.season}
                direction="watch"
                episodeNumbers={Array.from({ length: activeSeason.episodeCount }, (_, i) => i + 1)}
                previousSeasons={previousSeasonsToWatch}
              />
            )}
          </div>

          <div className="flex flex-col gap-2.5">
            {Array.from({ length: activeSeason.episodeCount }, (_, i) => i + 1).map((ep) => {
              const watched = watchedSet.has(`${activeSeason.season}-${ep}`);
              const title = titleByEpisode.get(ep);
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
                    <span className="flex flex-1 items-center justify-between gap-3 text-sm text-mp-text">
                      <span>
                        Épisode {ep}
                        {title ? ` – ${title}` : ""}
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-mp-text-dim">
                        {formatAirDate(airDateByEpisode.get(ep))}
                      </span>
                    </span>
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
