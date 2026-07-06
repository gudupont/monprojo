import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getActiveProfile } from "@/lib/session";
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

export default async function WatchlistPage() {
  const profile = await getActiveProfile();
  if (!profile) redirect("/profiles");

  const items = await db.watchlistItem.findMany({
    where: { profileId: profile.id },
    include: { media: true },
    orderBy: { addedAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Watchlist de {profile.name}</h1>

      {STATUS_ORDER.map((status) => {
        const itemsForStatus = items.filter((item) => item.status === status);
        if (itemsForStatus.length === 0) return null;

        return (
          <section key={status} className="space-y-3">
            <h2 className="text-lg font-medium">{STATUS_LABELS[status]}</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {itemsForStatus.map((item) => (
                <MediaCard
                  key={item.id}
                  tmdbId={item.media.tmdbId}
                  type={item.media.type}
                  title={item.media.title}
                  poster={item.media.poster}
                  releaseDate={item.media.releaseDate}
                  tmdbRating={item.media.tmdbRating}
                  imdbRating={item.media.imdbRating}
                  footer={
                    <div className="flex flex-wrap gap-1 pt-1">
                      {STATUS_ORDER.filter((s) => s !== status).map((s) => (
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
          </section>
        );
      })}

      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Votre watchlist est vide. Cherchez un film ou une série pour l&apos;ajouter.
        </p>
      )}
    </div>
  );
}
