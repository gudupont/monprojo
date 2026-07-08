"use client";

import { useEffect, useState } from "react";

const BASE_COLUMNS = 2;

// Aligned with the watchlist grid's grid-cols-* classes (see src/app/watchlist/page.tsx).
const BREAKPOINTS = [
  { query: "(min-width: 1536px)", columns: 8 },
  { query: "(min-width: 1280px)", columns: 6 },
  { query: "(min-width: 1024px)", columns: 5 },
  { query: "(min-width: 768px)", columns: 3 },
  { query: "(min-width: 640px)", columns: 5 },
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
