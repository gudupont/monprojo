import { redirect } from "next/navigation";
import { getActiveProfile } from "@/lib/session";
import { getWatchStats } from "@/lib/actions/stats";
import { formatWatchDuration } from "@/lib/format-duration";

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="shrink-0">
      <dd className="font-heading text-4xl leading-none text-mp-accent sm:text-5xl">{value}</dd>
      <dt className="mt-2 text-xs text-mp-text-dim">{label}</dt>
    </div>
  );
}

function SecondaryStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dd className="text-lg font-semibold text-mp-text">{value}</dd>
      <dt className="text-xs text-mp-text-dim">{label}</dt>
    </div>
  );
}

export default async function StatsPage() {
  const profile = await getActiveProfile();
  if (!profile) redirect("/profiles");

  const stats = await getWatchStats(profile.id);

  const hasSeriesActivity =
    stats.series.watchMinutes > 0 || stats.series.episodesWatched > 0 || stats.series.seriesAdded > 0;
  const hasMoviesActivity =
    stats.movies.watchMinutes > 0 || stats.movies.moviesWatched > 0 || stats.movies.moviesAdded > 0;

  return (
    <div className="px-4 pt-5 md:px-10 md:pt-0">
      <h1 className="mb-8 font-heading text-[30px] text-mp-text md:text-[38px]">Statistiques</h1>

      <section className="mb-10">
        <h2 className="mb-4 text-sm font-semibold text-mp-text-dim">Séries</h2>
        {hasSeriesActivity ? (
          <dl className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-10">
            <HeroStat value={formatWatchDuration(stats.series.watchMinutes)} label="temps de visionnage" />
            <div className="flex gap-8 border-t border-mp-border pt-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-8">
              <SecondaryStat value={String(stats.series.episodesWatched)} label="épisodes vus" />
              <SecondaryStat value={String(stats.series.seriesAdded)} label="séries ajoutées" />
            </div>
          </dl>
        ) : (
          <p className="text-sm text-mp-text-dim">Aucune série suivie pour le moment.</p>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold text-mp-text-dim">Films</h2>
        {hasMoviesActivity ? (
          <dl className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-10">
            <HeroStat value={formatWatchDuration(stats.movies.watchMinutes)} label="temps de visionnage" />
            <div className="flex gap-8 border-t border-mp-border pt-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-8">
              <SecondaryStat value={String(stats.movies.moviesWatched)} label="films vus" />
              <SecondaryStat value={String(stats.movies.moviesAdded)} label="films ajoutés" />
            </div>
          </dl>
        ) : (
          <p className="text-sm text-mp-text-dim">Aucun film suivi pour le moment.</p>
        )}
      </section>
    </div>
  );
}
