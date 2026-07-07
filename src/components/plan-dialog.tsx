"use client";

import { useState } from "react";
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

type PlanDialogProps = { title: string } & (
  | { mediaId: string; tmdbId?: undefined; type?: undefined }
  | { mediaId?: undefined; tmdbId: number; type: TmdbMediaType }
);

export function PlanDialog({ mediaId, tmdbId, type, title }: PlanDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        Planifier
      </DialogTrigger>
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
