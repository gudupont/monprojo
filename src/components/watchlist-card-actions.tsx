"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { MoreVertical, Clock3, PlayCircle, CheckCircle2, Trash2, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  updateWatchlistStatus,
  removeFromWatchlist,
  unhideFromContinueWatching,
} from "@/lib/actions/watchlist";
import type { WatchStatus } from "@prisma/client";

const STATUS_LABELS: Record<WatchStatus, string> = {
  TO_WATCH: "À voir",
  WATCHING: "En cours",
  WATCHED: "Vu",
};
const STATUS_ICONS: Record<WatchStatus, typeof Clock3> = {
  TO_WATCH: Clock3,
  WATCHING: PlayCircle,
  WATCHED: CheckCircle2,
};
const STATUS_ORDER: WatchStatus[] = ["TO_WATCH", "WATCHING", "WATCHED"];

export function WatchlistCardActions({
  id,
  status,
  hiddenFromContinue,
}: {
  id: string;
  status: WatchStatus;
  hiddenFromContinue: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  function handleRemoveClick() {
    if (!confirming) {
      setConfirming(true);
      resetTimer.current = setTimeout(() => setConfirming(false), 3000);
      return;
    }

    if (resetTimer.current) clearTimeout(resetTimer.current);
    startTransition(() => removeFromWatchlist(id));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Actions"
        className="flex size-11 cursor-pointer items-center justify-center rounded-full bg-black/55 text-white outline-none backdrop-blur-sm hover:bg-black/70 focus-visible:ring-2 focus-visible:ring-mp-accent"
      >
        <MoreVertical size={16} strokeWidth={1.8} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {STATUS_ORDER.filter((s) => s !== status).map((s) => {
          const Icon = STATUS_ICONS[s];
          return (
            <DropdownMenuItem key={s} onClick={() => updateWatchlistStatus(id, s)}>
              <Icon size={16} strokeWidth={1.8} />
              {STATUS_LABELS[s]}
            </DropdownMenuItem>
          );
        })}
        {hiddenFromContinue && (
          <DropdownMenuItem onClick={() => unhideFromContinueWatching(id)}>
            <Eye size={16} strokeWidth={1.8} />
            Réafficher dans Continuer à regarder
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={handleRemoveClick}
          closeOnClick={confirming}
          disabled={isPending}
          aria-live="polite"
          className="text-destructive data-highlighted:bg-destructive/10 data-highlighted:text-destructive"
        >
          <Trash2 size={16} strokeWidth={1.8} />
          {confirming ? "Confirmer ?" : "Retirer"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
