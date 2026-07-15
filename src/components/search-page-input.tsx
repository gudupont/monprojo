"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

interface SearchPageInputProps {
  initialQuery?: string;
  initialType?: string;
}

export function SearchPageInput({ initialQuery = "", initialType }: SearchPageInputProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      const trimmed = query.trim();
      const params = new URLSearchParams();
      if (trimmed) params.set("q", trimmed);
      if (initialType && initialType !== "tout") params.set("type", initialType);
      const queryString = params.toString();
      router.replace(queryString ? `/search?${queryString}` : "/search");
    }, 400);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="flex items-center gap-2.5 rounded-xl ring-1 ring-mp-border bg-mp-surface-2 px-4 py-3">
      <Search size={18} strokeWidth={2} className="shrink-0 text-mp-text" />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Un titre, une série…"
        aria-label="Recherche"
        className="flex-1 bg-transparent text-[15px] font-medium text-mp-text outline-none placeholder:text-mp-text-dim"
      />
    </div>
  );
}
