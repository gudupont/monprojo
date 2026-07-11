"use client";

import { useState, useTransition } from "react";
import { Plus, Check, Loader2, AlertCircle } from "lucide-react";
import { PlanDialog } from "@/components/plan-dialog";
import { quickAddToWatchlist } from "@/lib/actions/watchlist";
import type { TmdbMediaType } from "@/lib/tmdb";

type WatchlistButtonState = "idle" | "added" | "error";

const STATE_LABELS: Record<WatchlistButtonState, string> = {
  idle: "Ajouter à la watchlist",
  added: "Ajouté à la watchlist",
  error: "Échec de l'ajout, réessayer",
};

export function QuickAddActions({
  tmdbId,
  type,
  title,
  initialInWatchlist,
}: {
  tmdbId: number;
  type: TmdbMediaType;
  title: string;
  initialInWatchlist?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<WatchlistButtonState>(initialInWatchlist ? "added" : "idle");

  return (
    <div className="flex gap-1.5">
      <button
        type="button"
        disabled={isPending || state === "added"}
        aria-label={STATE_LABELS[state]}
        onClick={() => {
          startTransition(async () => {
            const result = await quickAddToWatchlist(tmdbId, type);
            setState(result.status === "error" ? "error" : "added");
          });
        }}
        className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm hover:bg-black/70 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <Loader2 size={16} strokeWidth={1.8} className="animate-spin" />
        ) : state === "added" ? (
          <Check size={16} strokeWidth={1.8} className="text-mp-accent" />
        ) : state === "error" ? (
          <AlertCircle size={16} strokeWidth={1.8} className="text-destructive" />
        ) : (
          <Plus size={16} strokeWidth={1.8} />
        )}
      </button>
      <PlanDialog tmdbId={tmdbId} type={type} title={title} compact />
    </div>
  );
}
