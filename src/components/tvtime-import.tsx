"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface SeriesReport {
  tvtimeName: string;
  matched: boolean;
  tmdbTitle?: string;
  method: "detailed" | "approximated" | "none";
  episodesImported: number;
  status?: "TO_WATCH" | "WATCHING" | "WATCHED";
}

interface ImportReport {
  matched: number;
  unmatched: number;
  series: SeriesReport[];
  error?: string;
}

export interface InitialImportBatch {
  id: string;
  status: "RUNNING" | "DONE" | "ROLLED_BACK";
  progress: { processed: number; total: number } | null;
  report: ImportReport | null;
  isOrphaned: boolean;
}

interface TvtimeImportProps {
  initialBatch: InitialImportBatch | null;
}

export function TvtimeImport({ initialBatch }: TvtimeImportProps) {
  const [batch, setBatch] = useState<InitialImportBatch | null>(initialBatch);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [decideError, setDecideError] = useState<string | null>(null);
  const [isDeciding, setIsDeciding] = useState(false);
  const [rollbackInProgress, setRollbackInProgress] = useState(false);

  useEffect(() => {
    if (!batch || batch.status === "DONE") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/import/${batch.id}`);
        if (!res.ok) return;
        const data = await res.json();
        setBatch((prev) =>
          prev
            ? {
                ...prev,
                status: data.status,
                progress: data.progress,
                report: data.report,
              }
            : prev
        );
      } catch {
        // le serveur peut être temporairement injoignable, on retentera au prochain tick
      }
    }, 2000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- poll keyed on id/status only, not on every progress update
  }, [batch?.id, batch?.status]);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploadError(null);
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) {
      setUploadError("Sélectionne un fichier .zip.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/import/tvtime", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error ?? "Erreur lors du démarrage de l'import.");
        return;
      }
      setBatch({ id: data.batchId, status: "RUNNING", progress: null, report: null, isOrphaned: false });
      form.reset();
    } catch {
      setUploadError("Erreur réseau lors de l'envoi du fichier.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDecide(action: "keep" | "rollback") {
    if (!batch) return;
    setDecideError(null);
    setIsDeciding(true);
    if (action === "rollback") setRollbackInProgress(true);

    try {
      const res = await fetch(`/api/import/${batch.id}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (action === "keep") {
        const data = await res.json();
        if (!res.ok) {
          setDecideError(data.error ?? "Erreur lors de la décision.");
          setIsDeciding(false);
          return;
        }
        setBatch(null);
      }
      // pour "rollback", le serveur redémarre : pas de réponse fiable attendue
    } catch {
      if (action === "rollback") {
        // le process a probablement redémarré, la requête échoue par nature
        return;
      }
      setDecideError("Erreur réseau lors de la décision.");
      setIsDeciding(false);
    }
  }

  if (!batch) {
    return (
      <div className="rounded-xl border border-mp-border bg-mp-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-mp-text-dim">Importer depuis TVtime</h2>
        <form onSubmit={handleUpload} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="file"
            name="file"
            accept=".zip"
            required
            className="text-sm text-mp-text-dim file:mr-3 file:rounded-md file:border-0 file:bg-mp-border file:px-3 file:py-1.5 file:text-mp-text"
          />
          <Button type="submit" disabled={isUploading}>
            {isUploading ? "Envoi…" : "Importer"}
          </Button>
        </form>
        {uploadError && <p className="mt-2 text-xs font-semibold text-red-400">{uploadError}</p>}
      </div>
    );
  }

  if (rollbackInProgress) {
    return (
      <div className="rounded-xl border border-mp-border bg-mp-surface p-4">
        <h2 className="mb-2 text-sm font-semibold text-mp-text-dim">Importer depuis TVtime</h2>
        <p className="text-sm text-mp-text">Restauration en cours, l&apos;application redémarre…</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-mp-border bg-mp-surface p-4">
      <h2 className="mb-3 text-sm font-semibold text-mp-text-dim">Importer depuis TVtime</h2>

      {batch.isOrphaned && (
        <p className="mb-3 text-xs font-semibold text-mp-accent">
          Un import a été interrompu par un redémarrage de l&apos;application. Choisis comment continuer.
        </p>
      )}

      {batch.status === "RUNNING" && !batch.isOrphaned && (
        <div>
          <p className="text-sm text-mp-text">
            Import en cours{batch.progress ? ` : ${batch.progress.processed}/${batch.progress.total} séries` : "…"}
          </p>
          {batch.progress && batch.progress.total > 0 && (
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-mp-border">
              <div
                className="h-full bg-mp-accent transition-all"
                style={{ width: `${Math.min(100, (batch.progress.processed / batch.progress.total) * 100)}%` }}
              />
            </div>
          )}
        </div>
      )}

      {(batch.status === "DONE" || batch.isOrphaned) && (
        <div className="space-y-3">
          {batch.report && (
            <div>
              <p className="text-sm text-mp-text">
                {batch.report.matched} série(s) matchée(s), {batch.report.unmatched} non matchée(s).
              </p>
              <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-xs text-mp-text-dim">
                {batch.report.series.map((s) => (
                  <li key={s.tvtimeName}>
                    {s.matched
                      ? `[OK] ${s.tvtimeName} -> ${s.tmdbTitle} | ${s.method} | ${s.episodesImported} épisode(s) | ${s.status}`
                      : `[NON MATCHÉ] ${s.tvtimeName}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!batch.report && batch.isOrphaned && (
            <p className="text-sm text-mp-text-dim">Aucun rapport disponible pour cet import interrompu.</p>
          )}

          <div className="flex gap-2">
            <Button type="button" onClick={() => handleDecide("keep")} disabled={isDeciding}>
              Garder
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDecide("rollback")}
              disabled={isDeciding}
            >
              Annuler
            </Button>
          </div>
          {decideError && <p className="text-xs font-semibold text-red-400">{decideError}</p>}
        </div>
      )}
    </div>
  );
}
