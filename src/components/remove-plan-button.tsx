"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { deletePlanEntry } from "@/lib/actions/calendar";
import { Button } from "@/components/ui/button";

export function RemovePlanButton({ entryId }: { entryId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  function handleClick() {
    if (!confirming) {
      setConfirming(true);
      resetTimer.current = setTimeout(() => setConfirming(false), 3000);
      return;
    }

    if (resetTimer.current) clearTimeout(resetTimer.current);
    startTransition(() => deletePlanEntry(entryId));
  }

  return (
    <div aria-live="polite">
      <Button
        type="button"
        size="sm"
        variant={confirming ? "destructive" : "ghost"}
        onClick={handleClick}
        disabled={isPending}
        aria-label={confirming ? "Confirmer la suppression" : "Retirer du calendrier"}
        className="h-11 px-4 md:h-7 md:px-2.5"
      >
        {confirming ? "Confirmer ?" : "Retirer"}
      </Button>
    </div>
  );
}
