import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

interface MediaCardProps {
  tmdbId: number;
  type: "movie" | "tv" | "MOVIE" | "TV";
  title: string;
  poster: string | null;
  releaseDate: string | null;
  tmdbRating: number | null;
  imdbRating?: number | null;
  progressPercent?: number;
  footer?: React.ReactNode;
  hoverActions?: React.ReactNode;
}

export function MediaCard({
  tmdbId,
  type,
  title,
  poster,
  releaseDate,
  tmdbRating,
  imdbRating,
  progressPercent,
  footer,
  hoverActions,
}: MediaCardProps) {
  const normalizedType = type.toLowerCase() as "movie" | "tv";
  const year = releaseDate?.slice(0, 4);

  return (
    <Card className="overflow-hidden py-0 gap-0">
      <div className="group relative">
        <Link href={`/media/${normalizedType}/${tmdbId}`}>
          <div className="relative aspect-[2/3] w-full bg-muted">
            {poster ? (
              <Image src={poster} alt={title} fill className="object-cover" sizes="200px" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-mp-text-dim">Pas d&apos;affiche</div>
            )}
            {typeof progressPercent === "number" && progressPercent > 0 && (
              <div className="absolute inset-x-0 bottom-0 h-1 bg-black/45">
                <div className="h-full bg-mp-accent" style={{ width: `${progressPercent}%` }} />
              </div>
            )}
          </div>
        </Link>
        {hoverActions && (
          <div className="absolute top-1.5 right-1.5 flex gap-1.5 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 md:has-[[data-popup-open]]:opacity-100">
            {hoverActions}
          </div>
        )}
      </div>
      <CardContent className="space-y-1 p-3">
        <Link href={`/media/${normalizedType}/${tmdbId}`} className="line-clamp-1 text-sm font-medium">
          {title}
        </Link>
        <div className="flex flex-nowrap items-center gap-1.5">
          <span className="min-w-0 truncate rounded-full border border-mp-border px-2 py-1 text-xs font-semibold text-mp-text-dim">
            {normalizedType === "movie" ? "Film" : "Série"}
            {year ? ` · ${year}` : ""}
          </span>
          {tmdbRating ? (
            <span className="shrink-0 rounded-full border border-mp-border px-2 py-1 text-xs font-bold text-mp-accent">
              ★ {tmdbRating.toFixed(1)}
            </span>
          ) : imdbRating ? (
            <span className="shrink-0 rounded-full border border-mp-border px-2 py-1 text-xs font-bold text-mp-accent">
              IMDb {imdbRating.toFixed(1)}
            </span>
          ) : null}
        </div>
        {footer}
      </CardContent>
    </Card>
  );
}
