"use client";

import { useState, useTransition } from "react";
import { savePlexConfig } from "@/lib/actions/plex";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PlexSettingsProps {
  profileId: string;
  initialServerUrl: string;
  hasAccountConfig: boolean;
  hasServerConfig: boolean;
  lastSyncAt: Date | null;
  syncError: string | null;
}

export function PlexSettings({
  profileId,
  initialServerUrl,
  hasAccountConfig,
  hasServerConfig,
  lastSyncAt,
  syncError,
}: PlexSettingsProps) {
  const [accountToken, setAccountToken] = useState("");
  const [serverUrl, setServerUrl] = useState(initialServerUrl);
  const [serverToken, setServerToken] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");
    setError(null);
    startTransition(async () => {
      const result = await savePlexConfig(profileId, accountToken, serverUrl, serverToken);
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
        <label htmlFor="plex-account-token" className="text-xs font-semibold text-mp-text-dim">
          Token de compte Plex (Watchlist)
        </label>
        <Input
          id="plex-account-token"
          name="plexAccountToken"
          type="password"
          placeholder={hasAccountConfig ? "••••••••" : "Token de compte Plex"}
          value={accountToken}
          onChange={(e) => setAccountToken(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="plex-server-url" className="text-xs font-semibold text-mp-text-dim">
          URL du serveur Plex (statut vu)
        </label>
        <Input
          id="plex-server-url"
          name="plexServerUrl"
          placeholder="http://localhost:32400"
          value={serverUrl}
          onChange={(e) => setServerUrl(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="plex-server-token" className="text-xs font-semibold text-mp-text-dim">
          Token du serveur Plex
        </label>
        <Input
          id="plex-server-token"
          name="plexServerToken"
          type="password"
          placeholder={hasServerConfig ? "••••••••" : "Token du serveur Plex"}
          value={serverToken}
          onChange={(e) => setServerToken(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Test en cours…" : "Enregistrer"}
      </Button>
      {status === "success" && (
        <p className="whitespace-normal break-words text-xs font-semibold text-mp-accent">
          Connexion Plex réussie, config sauvegardée.
        </p>
      )}
      {status === "error" && (
        <p className="whitespace-normal break-words text-xs font-semibold text-red-400">{error}</p>
      )}
      {(lastSyncAt || syncError) && (
        <p className="whitespace-normal break-words text-xs text-mp-text-dim">
          {lastSyncAt && `Dernière synchro : ${lastSyncAt.toLocaleString("fr-FR")}`}
          {syncError && ` — Erreur : ${syncError}`}
        </p>
      )}
    </form>
  );
}
