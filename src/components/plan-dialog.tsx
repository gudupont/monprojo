"use client";

import { useState } from "react";
import { CalendarClock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createPlanEntry, resolveAndCreatePlanEntry } from "@/lib/actions/calendar";
import type { TmdbMediaType } from "@/lib/tmdb";

type PlanDialogProps = { title: string; compact?: boolean } & (
  | { mediaId: string; tmdbId?: undefined; type?: undefined }
  | { mediaId?: undefined; tmdbId: number; type: TmdbMediaType }
);

export function PlanDialog({ mediaId, tmdbId, type, title, compact = false }: PlanDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {compact ? (
        <DialogTrigger
          render={
            <button
              type="button"
              aria-label="Planifier"
              className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm hover:bg-black/70"
            />
          }
        >
          <CalendarClock size={16} strokeWidth={1.8} />
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button variant="outline" className="h-11 gap-2 rounded-full" />}>
          <CalendarClock size={16} />
          Planifier
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Planifier « {title} »</DialogTitle>
        </DialogHeader>
        <form
          action={async (formData) => {
            if (mediaId) {
              await createPlanEntry(formData);
            } else {
              await resolveAndCreatePlanEntry(formData);
            }
            setOpen(false);
          }}
          className="space-y-4"
        >
          {mediaId ? (
            <input type="hidden" name="mediaId" value={mediaId} />
          ) : (
            <>
              <input type="hidden" name="tmdbId" value={tmdbId} />
              <input type="hidden" name="type" value={type} />
            </>
          )}
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="scheduledAt">
              Date
            </label>
            <Input id="scheduledAt" name="scheduledAt" type="date" required />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="notes">
              Note (optionnel)
            </label>
            <Textarea id="notes" name="notes" placeholder="Ex: soirée pizza" />
          </div>
          <Button type="submit" className="w-full">
            Ajouter au calendrier
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
