"use client";

import { useState, useTransition } from "react";
import { saveSonarrConfig } from "@/lib/actions/sonarr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SonarrSettingsProps {
  profileId: string;
  initialUrl: string;
  hasConfig: boolean;
}

export function SonarrSettings({ profileId, initialUrl, hasConfig }: SonarrSettingsProps) {
  const [url, setUrl] = useState(initialUrl);
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");
    setError(null);
    startTransition(async () => {
      const result = await saveSonarrConfig(profileId, url, apiKey);
      if (result.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setError(result.error ?? "Erreur lors de la sauvegarde.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-mp-border bg-mp-surface p-4">
      <div className="space-y-1.5">
        <label htmlFor="sonarr-url" className="text-xs font-semibold text-mp-text-dim">
          URL du serveur Sonarr
        </label>
        <Input
          id="sonarr-url"
          name="sonarrUrl"
          placeholder="http://localhost:8989"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="sonarr-api-key" className="text-xs font-semibold text-mp-text-dim">
          Clé API
        </label>
        <Input
          id="sonarr-api-key"
          name="sonarrApiKey"
          type="password"
          placeholder={hasConfig ? "••••••••" : "Clé API Sonarr"}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          required
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Test en cours…" : "Enregistrer"}
      </Button>
      {status === "success" && (
        <p className="whitespace-normal break-words text-xs font-semibold text-mp-accent">
          Connexion Sonarr réussie, config sauvegardée.
        </p>
      )}
      {status === "error" && (
        <p className="whitespace-normal break-words text-xs font-semibold text-red-400">{error}</p>
      )}
    </form>
  );
}
