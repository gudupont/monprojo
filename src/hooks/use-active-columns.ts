"use client";

import { useEffect, useState } from "react";

const BASE_COLUMNS = 2;

// Aligned with WatchlistGrid's grid-cols-* classes (see src/components/watchlist-grid.tsx).
const BREAKPOINTS = [
  { query: "(min-width: 1536px)", columns: 6 },
  { query: "(min-width: 1280px)", columns: 5 },
  { query: "(min-width: 1024px)", columns: 3 },
];

function resolveColumns(): number {
  for (const bp of BREAKPOINTS) {
    if (window.matchMedia(bp.query).matches) return bp.columns;
  }
  return BASE_COLUMNS;
}

export function useActiveColumns(): number {
  const [columns, setColumns] = useState(BASE_COLUMNS);

  useEffect(() => {
    const lists = BREAKPOINTS.map((bp) => window.matchMedia(bp.query));
    const handler = () => setColumns(resolveColumns());
    handler();
    lists.forEach((mql) => mql.addEventListener("change", handler));
    return () => lists.forEach((mql) => mql.removeEventListener("change", handler));
  }, []);

  return columns;
}
