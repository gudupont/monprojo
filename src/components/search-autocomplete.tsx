"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, Plus, Check, Loader2, AlertCircle } from "lucide-react";
import { quickAddToWatchlist, type QuickAddResult } from "@/lib/actions/watchlist";
import type { TmdbMediaType } from "@/lib/tmdb";

interface Suggestion {
  tmdbId: number;
  type: TmdbMediaType;
  title: string;
  poster: string | null;
  releaseDate: string | null;
  tmdbRating: number | null;
  inWatchlist: boolean;
}

type AddState = "idle" | "loading" | "added" | "already-added" | "error";

interface SearchAutocompleteProps {
  initialQuery?: string;
  initialType?: string;
}

export function SearchAutocomplete({ initialQuery = "", initialType }: SearchAutocompleteProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addStates, setAddStates] = useState<Record<string, AddState>>({});
  const [activeIndex, setActiveIndex] = useState(-1);
  const [announcement, setAnnouncement] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const focusedRef = useRef(false);
  const listboxId = useId();

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
          const items = Array.isArray(data) ? data : [];
          setSuggestions(items);
          setAddStates((prev) => {
            const next = { ...prev };
            for (const item of items) {
              const key = `${item.type}-${item.tmdbId}`;
              next[key] = item.inWatchlist ? "already-added" : "idle";
            }
            return next;
          });
          setActiveIndex(-1);
          if (focusedRef.current) setOpen(true);
        })
        .catch((error) => {
          if (error.name !== "AbortError") {
            setSuggestions([]);
            if (focusedRef.current) setOpen(true);
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

  function goToMedia(item: Suggestion) {
    setOpen(false);
    router.push(`/media/${item.type}/${item.tmdbId}`);
  }

  function submitFullSearch() {
    const trimmed = query.trim();
    if (!trimmed) return;
    setOpen(false);
    const params = new URLSearchParams({ q: trimmed });
    if (initialType && initialType !== "tout") params.set("type", initialType);
    router.push(`/search?${params.toString()}`);
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) {
      if (event.key === "Enter") submitFullSearch();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (event.key === "Enter") {
      if (activeIndex >= 0) {
        goToMedia(suggestions[activeIndex]);
      } else {
        submitFullSearch();
      }
    }
  }

  async function handleQuickAdd(item: Suggestion) {
    const key = `${item.type}-${item.tmdbId}`;
    setAddStates((prev) => ({ ...prev, [key]: "loading" }));

    const result: QuickAddResult = await quickAddToWatchlist(item.tmdbId, item.type);

    if (result.status === "added") {
      setAddStates((prev) => ({ ...prev, [key]: "added" }));
      setAnnouncement(`${item.title} ajouté à la watchlist.`);
    } else if (result.status === "already-in-watchlist") {
      setAddStates((prev) => ({ ...prev, [key]: "already-added" }));
      setAnnouncement(`${item.title} est déjà dans la watchlist.`);
    } else {
      setAddStates((prev) => ({ ...prev, [key]: "error" }));
      setAnnouncement(`Échec de l'ajout de ${item.title}.`);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2.5 rounded-xl ring-1 ring-mp-border bg-mp-surface-2 px-4 py-3">
        <Search size={18} strokeWidth={2} className="shrink-0 text-mp-text" />
        <input
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
          aria-autocomplete="list"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => {
            focusedRef.current = true;
            if (query.trim().length >= 3) setOpen(true);
          }}
          onBlur={() => {
            focusedRef.current = false;
          }}
          onKeyDown={handleKeyDown}
          placeholder="Rechercher…"
          aria-label="Recherche"
          className="flex-1 bg-transparent text-[15px] font-medium text-mp-text outline-none placeholder:text-mp-text-dim"
        />
        {loading && <Loader2 size={16} className="shrink-0 animate-spin text-mp-text" />}
      </div>

      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-2 w-[max(100%,320px)] rounded-xl ring-1 ring-mp-border bg-mp-surface"
        >
          {suggestions.length === 0 ? (
            <p className="px-4 py-3 text-sm text-mp-text-dim">Aucun résultat pour cette recherche.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto overflow-x-hidden rounded-xl">
              {suggestions.map((item, index) => {
                const key = `${item.type}-${item.tmdbId}`;
                const addState = addStates[key] ?? "idle";
                const year = item.releaseDate?.slice(0, 4);
                const active = index === activeIndex;

                return (
                  <li
                    key={key}
                    id={`${listboxId}-option-${index}`}
                    role="option"
                    aria-selected={active}
                    className={`flex items-center gap-1 border-b border-mp-border px-2 py-1.5 last:border-b-0 ${
                      active ? "bg-mp-surface-2" : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => goToMedia(item)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 px-2 py-1 text-left"
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
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAdd(item)}
                      disabled={addState === "loading" || addState === "added" || addState === "already-added"}
                      aria-label={
                        addState === "error"
                          ? `Échec de l'ajout de ${item.title}, réessayer`
                          : `Ajouter ${item.title} à la watchlist`
                      }
                      className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-mp-border text-mp-text-dim disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {addState === "loading" && <Loader2 size={16} className="animate-spin" />}
                      {addState === "idle" && <Plus size={16} />}
                      {(addState === "added" || addState === "already-added") && (
                        <Check size={16} className="text-mp-accent" />
                      )}
                      {addState === "error" && <AlertCircle size={16} className="text-destructive" />}
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
