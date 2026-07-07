"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getWatchlistItemsByActor } from "@/lib/actions/watchlist";
import type { TmdbCastMember } from "@/lib/tmdb";
import type { Media, WatchlistItem } from "@prisma/client";

type WatchlistItemWithMedia = WatchlistItem & { media: Media };

export function CastList({ cast, mediaId }: { cast: TmdbCastMember[]; mediaId: string }) {
  const [activeActor, setActiveActor] = useState<TmdbCastMember | null>(null);
  const [items, setItems] = useState<WatchlistItemWithMedia[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSelect(actor: TmdbCastMember) {
    setActiveActor(actor);
    setLoading(true);
    try {
      const results = await getWatchlistItemsByActor(actor.tmdbId, mediaId);
      setItems(results);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2.5">
        {cast.map((actor) => (
          <button
            key={actor.tmdbId}
            type="button"
            onClick={() => handleSelect(actor)}
            className="flex items-center gap-2 rounded-full border border-mp-border bg-mp-surface py-1 pr-3.5 pl-1 text-left hover:bg-mp-surface-2"
          >
            <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-mp-surface-2">
              {actor.profilePath ? (
                <Image src={actor.profilePath} alt={actor.name} fill className="object-cover" sizes="28px" />
              ) : (
                <User size={14} className="absolute inset-0 m-auto text-mp-text-faint" />
              )}
            </span>
            <span className="text-xs font-semibold text-mp-text">{actor.name}</span>
          </button>
        ))}
      </div>

      <Dialog open={activeActor !== null} onOpenChange={(open) => !open && setActiveActor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{activeActor?.name}</DialogTitle>
          </DialogHeader>
          {loading ? (
            <p className="text-sm text-mp-text-dim">Chargement…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-mp-text-dim">
              Aucun autre titre avec cet acteur dans votre liste.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {items.map((item) => {
                const type = item.media.type === "MOVIE" ? "movie" : "tv";
                return (
                  <Link
                    key={item.id}
                    href={`/media/${type}/${item.media.tmdbId}`}
                    className="flex items-center gap-3 rounded-lg border border-mp-border p-2 hover:bg-mp-surface-2"
                  >
                    <span className="relative h-14 w-10 shrink-0 overflow-hidden rounded bg-mp-surface-2">
                      {item.media.poster ? (
                        <Image
                          src={item.media.poster}
                          alt={item.media.title}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      ) : null}
                    </span>
                    <span className="text-sm font-medium text-mp-text">{item.media.title}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
