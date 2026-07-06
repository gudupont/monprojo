import Link from "next/link";
import { searchMedia } from "@/lib/tmdb";
import { MediaCard } from "@/components/media-card";
import { SearchAutocomplete } from "@/components/search-autocomplete";

const TYPE_TABS = [
  { key: "tout", label: "Tout" },
  { key: "film", label: "Films" },
  { key: "serie", label: "Séries" },
] as const;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { q, type } = await searchParams;
  const activeType = type === "film" || type === "serie" ? type : "tout";
  const allResults = q ? await searchMedia(q) : [];
  const results = allResults.filter((item) => {
    if (activeType === "film") return item.type === "movie";
    if (activeType === "serie") return item.type === "tv";
    return true;
  });

  return (
    <div className="px-4 pt-5 md:px-10 md:pt-0">
      <div className="mb-4 md:mb-6">
        <h1 className="mb-5 font-heading text-[30px] text-mp-text md:text-[38px]">Recherche</h1>
        <SearchAutocomplete
          variant="page"
          initialQuery={q}
          initialType={activeType}
        />
      </div>

      <div className="mb-6 flex gap-2">
        {TYPE_TABS.map((tab) => (
          <Link
            key={tab.key}
            href={{ pathname: "/search", query: { ...(q ? { q } : {}), ...(tab.key !== "tout" ? { type: tab.key } : {}) } }}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold ${
              activeType === tab.key
                ? "bg-mp-accent text-mp-accent-ink"
                : "border border-mp-border bg-mp-surface text-mp-text-dim"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="mb-3 text-[13px] uppercase tracking-wide text-mp-text-dim">
        {q?.trim() ? `${results.length} résultat${results.length > 1 ? "s" : ""}` : "Cherche un titre pour commencer"}
      </div>

      {q?.trim() && results.length === 0 && (
        <p className="pb-10 text-sm text-mp-text-dim">Aucun résultat pour cette recherche.</p>
      )}

      <div className="grid grid-cols-2 gap-5 pb-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {results.map((item) => (
          <MediaCard
            key={`${item.type}-${item.tmdbId}`}
            tmdbId={item.tmdbId}
            type={item.type}
            title={item.title}
            poster={item.poster}
            releaseDate={item.releaseDate}
            tmdbRating={item.tmdbRating}
          />
        ))}
      </div>
    </div>
  );
}
