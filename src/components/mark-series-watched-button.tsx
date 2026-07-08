"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmActionModal } from "@/components/confirm-action-modal";
import { markSeriesWatched, unmarkSeriesWatched } from "@/lib/actions/episode";

export function MarkSeriesWatchedButton({ mediaId, watched }: { mediaId: string; watched: boolean }) {
  const [open, setOpen] = useState(false);

  function handleClick() {
    if (watched) {
      setOpen(true);
    } else {
      markSeriesWatched(mediaId);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant={watched ? "default" : "secondary"}
        className="h-11 gap-2 rounded-full"
        onClick={handleClick}
      >
        <Check size={16} />
        {watched ? "Vu" : "Marquer comme vu"}
      </Button>

      {open && (
        <ConfirmActionModal
          title="Marquer la série comme non vue"
          message="Tous les épisodes de toutes les saisons seront marqués comme non vus."
          onConfirm={() => {
            unmarkSeriesWatched(mediaId);
            setOpen(false);
          }}
          onCancel={() => setOpen(false)}
        />
      )}
    </>
  );
}
