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
      <Button type="button" variant="secondary" className="gap-2 rounded-full" disabled>
        <Check size={16} />
        {state === "added" ? "Ajouté à Radarr" : "Déjà dans Radarr"}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="outline"
        className="gap-2 rounded-full"
        onClick={handleClick}
        disabled={isPending}
      >
        {state === "error" ? <AlertCircle size={16} /> : <Download size={16} />}
        {isPending ? "Ajout en cours…" : "Ajouter à Radarr"}
      </Button>
      {state === "error" && error && <p className="text-xs font-semibold text-red-400">{error}</p>}
    </div>
  );
}
