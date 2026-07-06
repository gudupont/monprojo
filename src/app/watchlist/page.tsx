import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getActiveProfile } from "@/lib/session";
import { computeProgressPercent } from "@/lib/media-progress";
import { updateWatchlistStatus, removeFromWatchlist } from "@/lib/actions/watchlist";
import { MediaCard } from "@/components/media-card";
import { Button } from "@/components/ui/button";
import type { WatchStatus } from "@prisma/client";

const STATUS_LABELS: Record<WatchStatus, string> = {
  TO_WATCH: "À voir",
  WATCHING: "En cours",
  WATCHED: "Vu",
};
const STATUS_ORDER: WatchStatus[] = ["TO_WATCH", "WATCHING", "WATCHED"];

const FILTERS = [
  { key: "tout", label: "Tout" },
  { key: "film", label: "Films" },
  { key: "serie", label: "Séries" },
  { key: "encours", label: "En cours" },
  { key: "termine", label: "Terminé" },
] as const;

export default async function WatchlistPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const profile = await getActiveProfile();
  if (!profile) redirect("/profiles");

  const { filter } = await searchParams;
  const activeFilter = FILTERS.some((f) => f.key === filter) ? filter! : "tout";

  const items = await db.watchlistItem.findMany({
    where: { profileId: profile.id },
    include: { media: true },
    orderBy: { addedAt: "desc" },
  });

  const withProgress = await Promise.all(
    items.map(async (item) => ({
      item,
      progress: await computeProgressPercent(item.media, profile.id, item.status),
    })),
  );

  const filtered = withProgress.filter(({ item, progress }) => {
    if (activeFilter === "film") return item.media.type === "MOVIE";
    if (activeFilter === "serie") return item.media.type === "TV";
    if (activeFilter === "encours") return progress > 0 && progress < 100;
    if (activeFilter === "termine") return progress >= 100;
    return true;
  });

  return (
    <div className="px-4 pt-5 md:px-10 md:pt-0">
      <h1 className="mb-5 font-heading text-[30px] text-mp-text md:text-[38px]">Ma liste</h1>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={{ pathname: "/watchlist", query: f.key === "tout" ? {} : { filter: f.key } }}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold ${
              activeFilter === f.key
                ? "bg-mp-accent text-mp-accent-ink"
                : "border border-mp-border bg-mp-surface text-mp-text-dim"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="pb-10 text-sm text-mp-text-dim">Aucun titre ici pour le moment.</p>
      ) : (
        <div className="grid grid-cols-2 gap-5 pb-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map(({ item, progress }) => (
            <MediaCard
              key={item.id}
              tmdbId={item.media.tmdbId}
              type={item.media.type}
              title={item.media.title}
              poster={item.media.poster}
              releaseDate={item.media.releaseDate}
              tmdbRating={item.media.tmdbRating}
              imdbRating={item.media.imdbRating}
              progressPercent={progress}
              footer={
                <div className="flex flex-wrap gap-1 pt-1">
                  {STATUS_ORDER.filter((s) => s !== item.status).map((s) => (
                    <form key={s} action={updateWatchlistStatus.bind(null, item.id, s)}>
                      <Button type="submit" size="sm" variant="secondary">
                        {STATUS_LABELS[s]}
                      </Button>
                    </form>
                  ))}
                  <form action={removeFromWatchlist.bind(null, item.id)}>
                    <Button type="submit" size="sm" variant="ghost">
                      Retirer
                    </Button>
                  </form>
                </div>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
