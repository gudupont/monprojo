import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getActiveProfile } from "@/lib/session";
import { computeProgressPercentBatch } from "@/lib/media-progress";
import { WatchlistGrid } from "@/components/watchlist-grid";

const FILTERS = [
  { key: "tout", label: "Tout" },
  { key: "nonvu", label: "Non vus" },
  { key: "film", label: "Films" },
  { key: "serie", label: "Séries" },
  { key: "encours", label: "En cours" },
  { key: "termine", label: "Terminé" },
] as const;

export default async function WatchlistPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; page?: string }>;
}) {
  const profile = await getActiveProfile();
  if (!profile) redirect("/profiles");

  const { filter, page } = await searchParams;
  const activeFilter = FILTERS.some((f) => f.key === filter) ? filter! : "tout";
  const currentPage = Math.max(1, Number(page) || 1);

  const items = await db.watchlistItem.findMany({
    where: { profileId: profile.id },
    include: { media: true },
    orderBy: { addedAt: "desc" },
  });

  const progressByMediaId = await computeProgressPercentBatch(
    items.map((item) => ({ media: item.media, status: item.status })),
    profile.id,
  );
  const withProgress = items.map((item) => ({
    item,
    progress: progressByMediaId.get(item.media.id) ?? 0,
  }));

  const filtered = withProgress.filter(({ item, progress }) => {
    if (activeFilter === "nonvu") return item.status !== "WATCHED";
    if (activeFilter === "film") return item.media.type === "MOVIE";
    if (activeFilter === "serie") return item.media.type === "TV";
    if (activeFilter === "encours") return progress > 0 && progress < 100;
    if (activeFilter === "termine") return progress >= 100;
    return true;
  });

  const cardData = filtered.map(({ item, progress }) => ({
    id: item.id,
    status: item.status,
    tmdbId: item.media.tmdbId,
    type: item.media.type,
    title: item.media.title,
    poster: item.media.poster,
    releaseDate: item.media.releaseDate,
    tmdbRating: item.media.tmdbRating,
    imdbRating: item.media.imdbRating,
    progress,
  }));

  return (
    <div className="px-4 pt-5 md:px-10 md:pt-0">
      <h1 className="mb-5 font-heading text-[30px] text-mp-text md:text-[38px]">Ma liste</h1>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={{ pathname: "/watchlist", query: f.key === "tout" ? {} : { filter: f.key } }}
            aria-current={activeFilter === f.key ? "page" : undefined}
            className={`flex min-h-11 items-center whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold ${
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
        <WatchlistGrid items={cardData} initialPage={currentPage} />
      )}
    </div>
  );
}
