"use client";

import { useState, useTransition } from "react";
import { saveRadarrConfig } from "@/lib/actions/radarr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RadarrSettingsProps {
  profileId: string;
  initialUrl: string;
  hasConfig: boolean;
}

export function RadarrSettings({ profileId, initialUrl, hasConfig }: RadarrSettingsProps) {
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
      const result = await saveRadarrConfig(profileId, url, apiKey);
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
        <label htmlFor="radarr-url" className="text-xs font-semibold text-mp-text-dim">
          URL du serveur Radarr
        </label>
        <Input
          id="radarr-url"
          name="radarrUrl"
          placeholder="http://localhost:7878"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="radarr-api-key" className="text-xs font-semibold text-mp-text-dim">
          Clé API
        </label>
        <Input
          id="radarr-api-key"
          name="radarrApiKey"
          type="password"
          placeholder={hasConfig ? "••••••••" : "Clé API Radarr"}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          required
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Test en cours…" : "Enregistrer"}
      </Button>
      {status === "success" && (
        <p className="text-xs font-semibold text-mp-accent">Connexion Radarr réussie, config sauvegardée.</p>
      )}
      {status === "error" && (
        <p className="text-xs font-semibold text-red-400">{error}</p>
      )}
    </form>
  );
}
