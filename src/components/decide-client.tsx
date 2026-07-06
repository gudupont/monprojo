"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Check } from "lucide-react";

export interface DecideCandidate {
  id: string;
  tmdbId: number;
  type: "movie" | "tv";
  title: string;
  poster: string | null;
  genres: string[];
  metaLine: string;
  isDone: boolean;
}

const TYPE_TABS = [
  { key: "tous", label: "Tous" },
  { key: "film", label: "Films" },
  { key: "serie", label: "Séries" },
] as const;

export function DecideClient({ candidates }: { candidates: DecideCandidate[] }) {
  const [type, setType] = useState<(typeof TYPE_TABS)[number]["key"]>("tous");
  const [genres, setGenres] = useState<string[]>([]);
  const [excludeSeen, setExcludeSeen] = useState(false);
  const [pick, setPick] = useState<DecideCandidate | null>(null);

  const allGenres = useMemo(
    () => Array.from(new Set(candidates.flatMap((c) => c.genres))).sort(),
    [candidates],
  );

  const filtered = useMemo(() => {
    return candidates.filter((c) => {
      if (type === "film" && c.type !== "movie") return false;
      if (type === "serie" && c.type !== "tv") return false;
      if (genres.length && !genres.some((g) => c.genres.includes(g))) return false;
      if (excludeSeen && c.isDone) return false;
      return true;
    });
  }, [candidates, type, genres, excludeSeen]);

  function toggleGenre(g: string) {
    setGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  }

  function spin() {
    if (!filtered.length) {
      setPick(null);
      return;
    }
    setPick(filtered[Math.floor(Math.random() * filtered.length)]);
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setType(tab.key)}
            className={`rounded-full px-4 py-2 text-[13px] font-semibold ${
              type === tab.key ? "bg-mp-accent text-mp-accent-ink" : "border border-mp-border bg-mp-surface text-mp-text-dim"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {allGenres.length > 0 && (
        <>
          <div className="mb-2.5 text-xs uppercase tracking-wide text-mp-text-dim">Genres</div>
          <div className="mb-5 flex flex-wrap gap-2">
            {allGenres.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => toggleGenre(g)}
                className={`rounded-full px-4 py-2 text-[13px] font-semibold ${
                  genres.includes(g) ? "bg-mp-accent text-mp-accent-ink" : "border border-mp-border bg-mp-surface text-mp-text-dim"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </>
      )}

      <button
        type="button"
        onClick={() => setExcludeSeen((v) => !v)}
        className="mb-7 flex items-center gap-2.5 text-left"
      >
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${
            excludeSeen ? "bg-mp-accent text-mp-accent-ink" : "border border-mp-text-dim"
          }`}
        >
          {excludeSeen && <Check size={12} strokeWidth={3} />}
        </span>
        <span className="text-sm text-mp-text">Exclure ce que j&apos;ai déjà terminé</span>
      </button>

      <div className="mb-5 text-[13px] text-mp-text-dim">
        {filtered.length} titre{filtered.length > 1 ? "s" : ""} correspondent à tes critères
      </div>

      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={spin}
          disabled={!filtered.length}
          className={`mb-7 rounded-full px-8 py-4 text-base font-bold ${
            filtered.length ? "bg-mp-accent text-mp-accent-ink" : "bg-mp-surface-2 text-mp-text-dim"
          }`}
        >
          Lancer le tirage
        </button>

        {pick && (
          <div className="flex w-full max-w-xl flex-wrap items-center gap-6 rounded-[20px] border border-mp-border bg-mp-surface p-6">
            <div className="relative aspect-[2/3] w-[120px] shrink-0 overflow-hidden rounded-xl bg-mp-surface-2">
              {pick.poster && <Image src={pick.poster} alt={pick.title} fill className="object-cover" sizes="120px" />}
            </div>
            <div>
              <h2 className="mb-1.5 font-heading text-2xl text-mp-text">{pick.title}</h2>
              <div className="mb-3 text-[13px] text-mp-text-dim">{pick.metaLine}</div>
              <div className="flex flex-wrap gap-2.5">
                <Link
                  href={`/media/${pick.type}/${pick.tmdbId}`}
                  className="rounded-full bg-mp-accent px-4.5 py-2.5 text-[13px] font-bold text-mp-accent-ink"
                >
                  Regarder maintenant
                </Link>
                <button
                  type="button"
                  onClick={spin}
                  className="rounded-full border border-mp-border px-4.5 py-2.5 text-[13px] font-bold text-mp-text"
                >
                  Relancer
                </button>
              </div>
            </div>
          </div>
        )}

        {!filtered.length && (
          <div className="max-w-xs text-center text-sm text-mp-text-dim">
            Aucun titre ne correspond à ces critères — élargis tes filtres.
          </div>
        )}
      </div>
    </div>
  );
}
