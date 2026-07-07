"use client";

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, Plus, Check, Loader2 } from "lucide-react";
import { quickAddToWatchlist, type QuickAddResult } from "@/lib/actions/watchlist";
import type { TmdbMediaType } from "@/lib/tmdb";

interface Suggestion {
  tmdbId: number;
  type: TmdbMediaType;
  title: string;
  poster: string | null;
  releaseDate: string | null;
  tmdbRating: number | null;
}

type AddState = "idle" | "loading" | "added" | "already-added" | "error";

interface SearchAutocompleteProps {
  variant?: "page" | "header";
  initialQuery?: string;
  initialType?: string;
}

export function SearchAutocomplete({ variant = "page", initialQuery = "", initialType }: SearchAutocompleteProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addStates, setAddStates] = useState<Record<string, AddState>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (query.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const timeout = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);

      fetch(`/api/search/autocomplete?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((data: Suggestion[]) => {
          setSuggestions(Array.isArray(data) ? data : []);
          setOpen(true);
        })
        .catch((error) => {
          if (error.name !== "AbortError") {
            setSuggestions([]);
            setOpen(true);
          }
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    const trimmed = query.trim();
    if (!trimmed) return;

    setOpen(false);
    const params = new URLSearchParams({ q: trimmed });
    if (initialType && initialType !== "tout") params.set("type", initialType);
    router.push(`/search?${params.toString()}`);
  }

  async function handleQuickAdd(item: Suggestion) {
    const key = `${item.type}-${item.tmdbId}`;
    setAddStates((prev) => ({ ...prev, [key]: "loading" }));

    const result: QuickAddResult = await quickAddToWatchlist(item.tmdbId, item.type);

    if (result.status === "added") {
      setAddStates((prev) => ({ ...prev, [key]: "added" }));
    } else if (result.status === "already-in-watchlist") {
      setAddStates((prev) => ({ ...prev, [key]: "already-added" }));
    } else {
      setAddStates((prev) => ({ ...prev, [key]: "error" }));
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2.5 rounded-xl border-2 border-mp-border bg-mp-surface-2 px-4 py-3 shadow-sm">
        <Search size={18} strokeWidth={2} className="shrink-0 text-mp-text" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => query.trim().length >= 3 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={variant === "header" ? "Rechercher…" : "Un titre, une série…"}
          aria-label="Recherche"
          className="flex-1 bg-transparent text-[15px] font-medium text-mp-text outline-none placeholder:text-mp-text-dim"
        />
        {loading && <Loader2 size={16} className="shrink-0 animate-spin text-mp-text" />}
      </div>

      {open && (
        <div className="absolute z-20 mt-2 w-[max(100%,320px)] rounded-xl border border-mp-border bg-mp-surface shadow-lg">
          {suggestions.length === 0 ? (
            <p className="px-4 py-3 text-sm text-mp-text-dim">Aucun résultat pour cette recherche.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto overflow-x-hidden rounded-xl">
              {suggestions.map((item) => {
                const key = `${item.type}-${item.tmdbId}`;
                const addState = addStates[key] ?? "idle";
                const year = item.releaseDate?.slice(0, 4);

                return (
                  <li
                    key={key}
                    className="flex items-center gap-3 border-b border-mp-border px-4 py-2.5 last:border-b-0"
                  >
                    <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded bg-mp-bg">
                      {item.poster ? (
                        <Image src={item.poster} alt={item.title} fill className="object-cover" sizes="40px" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] text-mp-text">{item.title}</p>
                      <div className="flex items-center gap-2 text-[12px] text-mp-text-dim">
                        {year && <span>{year}</span>}
                        <span className="rounded-full border border-mp-border px-2 py-0.5">
                          {item.type === "movie" ? "Film" : "Série"}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleQuickAdd(item)}
                      disabled={addState === "loading" || addState === "added" || addState === "already-added"}
                      aria-label={`Ajouter ${item.title} à la watchlist`}
                      className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-mp-border text-mp-text-dim disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {addState === "loading" && <Loader2 size={16} className="animate-spin" />}
                      {addState === "idle" && <Plus size={16} />}
                      {(addState === "added" || addState === "already-added") && (
                        <Check size={16} className="text-mp-accent" />
                      )}
                      {addState === "error" && <Plus size={16} className="text-red-400" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
