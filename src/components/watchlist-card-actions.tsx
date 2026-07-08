"use client";

import { MoreVertical, Clock3, PlayCircle, CheckCircle2, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { updateWatchlistStatus, removeFromWatchlist } from "@/lib/actions/watchlist";
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

export function WatchlistCardActions({ id, status }: { id: string; status: WatchStatus }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Actions"
        className="flex size-7 cursor-pointer items-center justify-center rounded-full text-white outline-none hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-mp-accent"
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
        <DropdownMenuItem
          onClick={() => removeFromWatchlist(id)}
          className="text-destructive data-highlighted:bg-destructive/10 data-highlighted:text-destructive"
        >
          <Trash2 size={16} strokeWidth={1.8} />
          Retirer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
