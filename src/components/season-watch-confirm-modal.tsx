"use client";

import { useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmActionModal } from "@/components/confirm-action-modal";
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

  if (direction === "unwatch") {
    return (
      <Button
        type="button"
        size="default"
        variant="secondary"
        className="gap-2 rounded-full"
        onClick={() => unmarkSeasonWatched(mediaId, season)}
      >
        <RotateCcw size={16} />
        Marquer la saison comme non vue
      </Button>
    );
  }

  async function apply() {
    await markSeasonWatched(
      mediaId,
      season,
      episodeNumbers,
      previousSeasons.map((s) => ({ season: s.season, episodeNumbers: s.episodeNumbers ?? [] })),
    );
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
      <Button
        type="button"
        size="default"
        variant="secondary"
        className="gap-2 rounded-full"
        onClick={handleClick}
      >
        <Check size={16} />
        Marquer la saison comme vue
      </Button>

      {open && (
        <ConfirmActionModal
          title="Marquer les saisons comme vues"
          message={`${summarizeSeasons(previousSeasons)} ${
            previousSeasons.length > 1 ? "seront également" : "sera également"
          } marquée(s) comme vue(s) en plus de la saison ${season}.`}
          onConfirm={apply}
          onCancel={() => setOpen(false)}
        />
      )}
    </>
  );
}
