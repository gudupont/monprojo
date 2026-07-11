"use client";

import { useEffect, useState, useTransition } from "react";
import { getOrCreateCalendarToken, regenerateCalendarToken } from "@/lib/actions/calendar";
import { Button } from "@/components/ui/button";

export function CalendarSubscription() {
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getOrCreateCalendarToken().then(setToken);
  }, []);

  const url = token && typeof window !== "undefined" ? `${window.location.origin}/api/calendar/${token}` : "";

  function handleCopy() {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleRegenerate() {
    startTransition(async () => {
      const newToken = await regenerateCalendarToken();
      setToken(newToken);
      setCopied(false);
    });
  }

  return (
    <div className="mb-6 space-y-2 rounded-xl border border-mp-border bg-mp-surface p-4">
      <div className="text-xs font-semibold text-mp-text-dim">S&apos;abonner (Google Agenda &amp; co.)</div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          readOnly
          aria-label="URL d'abonnement au calendrier"
          value={url}
          placeholder="Génération de l'URL…"
          className="min-w-0 flex-1 rounded-lg border border-mp-border bg-mp-surface-2 px-2.5 py-1.5 text-xs text-mp-text"
          onFocus={(e) => e.target.select()}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleCopy}
          disabled={!url}
          className="h-11 px-4 md:h-7 md:px-2.5"
        >
          {copied ? "Copié !" : "Copier"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={handleRegenerate}
          disabled={isPending}
          className="h-11 px-4 md:h-7 md:px-2.5"
        >
          Régénérer
        </Button>
      </div>
    </div>
  );
}
