"use client";

import { useState, useTransition } from "react";
import { Download, Check, AlertCircle } from "lucide-react";
import { addToRadarr } from "@/lib/actions/radarr";
import { Button } from "@/components/ui/button";

interface RadarrButtonProps {
  profileId: string;
  tmdbId: number;
  initiallyPresent: boolean;
}

export function RadarrButton({ profileId, tmdbId, initiallyPresent }: RadarrButtonProps) {
  const [state, setState] = useState<"idle" | "already_present" | "added" | "error">(
    initiallyPresent ? "already_present" : "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await addToRadarr(profileId, tmdbId);
      if (result.state === "error") {
        setError(result.error ?? "Erreur de connexion à Radarr.");
      }
      setState(result.state);
    });
  }

  if (state === "already_present" || state === "added") {
    return (
      <Button type="button" variant="secondary" className="h-11 gap-2 rounded-full" disabled>
        <Check size={16} />
        <span role="status" aria-live="polite">
          {state === "added" ? "Ajouté à Radarr" : "Déjà dans Radarr"}
        </span>
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="outline"
        className="h-11 gap-2 rounded-full"
        onClick={handleClick}
        disabled={isPending}
      >
        {state === "error" ? <AlertCircle size={16} /> : <Download size={16} />}
        <span role="status" aria-live="polite">
          {isPending ? "Ajout en cours…" : "Ajouter à Radarr"}
        </span>
      </Button>
      {state === "error" && error && (
        <p role="status" aria-live="polite" className="text-xs font-semibold text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
