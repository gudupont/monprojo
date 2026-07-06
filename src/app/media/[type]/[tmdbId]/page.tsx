import Image from "next/image";
import { notFound } from "next/navigation";
import { getMediaDetail } from "@/lib/tmdb";
import { getOrRefreshMedia } from "@/lib/actions/media";
import { addToWatchlist } from "@/lib/actions/watchlist";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlanDialog } from "@/components/plan-dialog";

export default async function MediaDetailPage({
  params,
}: {
  params: Promise<{ type: string; tmdbId: string }>;
}) {
  const { type, tmdbId } = await params;
  if (type !== "movie" && type !== "tv") notFound();

  const tmdbIdNumber = Number.parseInt(tmdbId, 10);
  if (Number.isNaN(tmdbIdNumber)) notFound();

  const [media, detail] = await Promise.all([
    getOrRefreshMedia(tmdbIdNumber, type),
    getMediaDetail(tmdbIdNumber, type),
  ]);

  return (
    <div className="grid gap-6 sm:grid-cols-[300px_1fr]">
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-muted">
        {media.poster ? (
          <Image src={media.poster} alt={media.title} fill className="object-cover" sizes="300px" />
        ) : null}
      </div>

      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">{media.title}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            {media.releaseDate && <span>{media.releaseDate.slice(0, 4)}</span>}
            <Badge variant="secondary">{type === "movie" ? "Film" : "Série"}</Badge>
            {media.tmdbRating ? <span>TMDb {media.tmdbRating.toFixed(1)}</span> : null}
            {media.imdbRating ? <span>IMDb {media.imdbRating.toFixed(1)}</span> : null}
          </div>
        </div>

        {detail.cast.length > 0 && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Casting : </span>
            {detail.cast.join(", ")}
          </p>
        )}

        <p className="text-sm leading-relaxed">{media.overview}</p>

        <div className="flex gap-3">
          <form action={addToWatchlist.bind(null, media.id)}>
            <Button type="submit">Ajouter à ma watchlist</Button>
          </form>
          <PlanDialog mediaId={media.id} title={media.title} />
        </div>
      </div>
    </div>
  );
}
