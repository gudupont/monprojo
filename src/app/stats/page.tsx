import { redirect } from "next/navigation";
import { getActiveProfile } from "@/lib/session";
import { getWatchStats } from "@/lib/actions/stats";
import { formatWatchDuration } from "@/lib/format-duration";

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-mp-border bg-mp-surface p-4">
      <span className="block font-heading text-2xl text-mp-accent">{value}</span>
      <span className="text-xs text-mp-text-dim">{label}</span>
    </div>
  );
}

export default async function StatsPage() {
  const profile = await getActiveProfile();
  if (!profile) redirect("/profiles");

  const stats = await getWatchStats(profile.id);

  return (
    <div className="px-4 pt-5 md:px-10 md:pt-0">
      <h1 className="mb-6 font-heading text-[30px] text-mp-text md:text-[38px]">Statistiques</h1>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-mp-text-dim">Séries</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatTile value={formatWatchDuration(stats.series.watchMinutes)} label="temps de visionnage" />
          <StatTile value={String(stats.series.episodesWatched)} label="épisodes vus" />
          <StatTile value={String(stats.series.seriesAdded)} label="séries ajoutées" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-mp-text-dim">Films</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatTile value={formatWatchDuration(stats.movies.watchMinutes)} label="temps de visionnage" />
          <StatTile value={String(stats.movies.moviesWatched)} label="films vus" />
          <StatTile value={String(stats.movies.moviesAdded)} label="films ajoutés" />
        </div>
      </section>
    </div>
  );
}
