"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { PlanDialog } from "@/components/plan-dialog";
import { quickAddToWatchlist } from "@/lib/actions/watchlist";
import type { TmdbMediaType } from "@/lib/tmdb";

type WatchlistButtonState = "idle" | "added" | "error";

export function QuickAddActions({
  tmdbId,
  type,
  title,
}: {
  tmdbId: number;
  type: TmdbMediaType;
  title: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<WatchlistButtonState>("idle");

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        size="sm"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            const result = await quickAddToWatchlist(tmdbId, type);
            setState(result.status === "error" ? "error" : "added");
          });
        }}
      >
        {state === "added" ? "Ajouté" : state === "error" ? "Erreur" : "Ajouter à la watchlist"}
      </Button>
      <PlanDialog tmdbId={tmdbId} type={type} title={title} />
    </div>
  );
}
