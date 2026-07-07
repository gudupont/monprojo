"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { markSeasonWatched, unmarkSeasonWatched } from "@/lib/actions/episode";

type PreviousSeason = { season: number; episodeNumbers?: number[] };

function summarizeSeasons(seasons: PreviousSeason[]): string {
  const numbers = seasons.map((s) => s.season).sort((a, b) => a - b);
  if (numbers.length > 3) {
    return `Saisons ${numbers[0]} à ${numbers[numbers.length - 1]}`;
  }
  return numbers.length === 1
    ? `Saison ${numbers[0]}`
    : `Saisons ${numbers.join(", ")}`;
}

export function SeasonWatchButton({
  mediaId,
  season,
  direction,
  episodeNumbers,
  previousSeasons,
}: {
  mediaId: string;
  season: number;
  direction: "watch" | "unwatch";
  episodeNumbers: number[];
  previousSeasons: PreviousSeason[];
}) {
  const [open, setOpen] = useState(false);

  async function apply() {
    if (direction === "watch") {
      await markSeasonWatched(
        mediaId,
        season,
        episodeNumbers,
        previousSeasons.map((s) => ({ season: s.season, episodeNumbers: s.episodeNumbers ?? [] })),
      );
    } else {
      await unmarkSeasonWatched(
        mediaId,
        season,
        previousSeasons.map((s) => ({ season: s.season })),
      );
    }
    setOpen(false);
  }

  function handleClick() {
    if (previousSeasons.length === 0) {
      apply();
    } else {
      setOpen(true);
    }
  }

  return (
    <>
      <Button type="button" size="sm" variant="secondary" onClick={handleClick}>
        {direction === "watch" ? "Marquer la saison comme vue" : "Marquer la saison comme non vue"}
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-mp-border bg-mp-surface p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-2 font-heading text-xl text-mp-text">
              {direction === "watch" ? "Marquer les saisons comme vues" : "Marquer les saisons comme non vues"}
            </h2>
            <p className="mb-5 text-sm leading-relaxed text-mp-text-dim">
              {summarizeSeasons(previousSeasons)}{" "}
              {previousSeasons.length > 1 ? "seront également" : "sera également"}{" "}
              {direction === "watch" ? "marquée(s) comme vue(s)" : "marquée(s) comme non vue(s)"} en plus de la saison {season}.
            </p>
            <div className="flex justify-end gap-3">
              <Button type="button" size="sm" variant="secondary" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="button" size="sm" onClick={apply}>
                Valider
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
