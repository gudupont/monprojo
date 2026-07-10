"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MediaCard } from "@/components/media-card";
import { WatchlistCardActions } from "@/components/watchlist-card-actions";
import { useActiveColumns } from "@/hooks/use-active-columns";
import type { WatchStatus } from "@prisma/client";

const ROWS_PER_PAGE = 5;

export interface WatchlistCardData {
  id: string;
  status: WatchStatus;
  tmdbId: number;
  type: "MOVIE" | "TV";
  title: string;
  poster: string | null;
  releaseDate: string | null;
  tmdbRating: number | null;
  imdbRating: number | null;
  progress: number;
  hiddenFromContinue: boolean;
}

export function WatchlistGrid({
  items,
  initialPage,
}: {
  items: WatchlistCardData[];
  initialPage: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const columns = useActiveColumns();
  const pageSize = columns * ROWS_PER_PAGE;
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const [currentPage, setCurrentPage] = useState(() =>
    Math.min(Math.max(1, initialPage), totalPages),
  );

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  useEffect(() => {
    const urlPage = Number(searchParams.get("page")) || 1;
    if (urlPage === currentPage) return;
    const params = new URLSearchParams(searchParams.toString());
    if (currentPage <= 1) params.delete("page");
    else params.set("page", String(currentPage));
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const goToPage = (page: number) => {
    const clamped = Math.min(Math.max(1, page), totalPages);
    setCurrentPage((prev) => {
      if (clamped !== prev) {
        document.querySelector("main")?.scrollTo({ top: 0 });
      }
      return clamped;
    });
  };

  const paginated = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <>
      <div className="grid grid-cols-2 gap-5 pb-6 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6">
        {paginated.map((data) => (
          <MediaCard
            key={data.id}
            tmdbId={data.tmdbId}
            type={data.type}
            title={data.title}
            poster={data.poster}
            releaseDate={data.releaseDate}
            tmdbRating={data.tmdbRating}
            imdbRating={data.imdbRating}
            progressPercent={data.progress}
            hoverActions={
              <WatchlistCardActions
                id={data.id}
                status={data.status}
                hiddenFromContinue={data.hiddenFromContinue}
              />
            }
            footer={
              data.hiddenFromContinue ? (
                <span className="inline-block rounded-full border border-mp-border px-2 py-1 text-xs font-semibold text-mp-text-dim">
                  Retiré de la reprise
                </span>
              ) : undefined
            }
          />
        ))}
      </div>

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-center gap-3 pb-10">
          <button
            type="button"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className={`flex min-h-11 min-w-11 items-center justify-center rounded-full border border-mp-border bg-mp-surface px-4 text-[13px] font-semibold text-mp-text-dim ${
              currentPage <= 1 ? "pointer-events-none opacity-40" : ""
            }`}
          >
            Précédent
          </button>
          <span className="text-[13px] text-mp-text-dim">
            Page {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className={`flex min-h-11 min-w-11 items-center justify-center rounded-full border border-mp-border bg-mp-surface px-4 text-[13px] font-semibold text-mp-text-dim ${
              currentPage >= totalPages ? "pointer-events-none opacity-40" : ""
            }`}
          >
            Suivant
          </button>
        </nav>
      )}
    </>
  );
}
