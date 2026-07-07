import Image from "next/image";
import type { TmdbWatchProvider } from "@/lib/tmdb";

const TMDB_LOGO_BASE_URL = "https://image.tmdb.org/t/p/w92";

interface WatchProvidersProps {
  link: string | null;
  providers: TmdbWatchProvider[];
}

export function WatchProviders({ link, providers }: WatchProvidersProps) {
  if (providers.length === 0) {
    return (
      <div className="mt-9">
        <h2 className="mb-3 font-heading text-2xl text-mp-text">Où regarder</h2>
        <p className="text-sm text-mp-text-dim">Non disponible en streaming actuellement.</p>
      </div>
    );
  }

  return (
    <div className="mt-9">
      <h2 className="mb-3 font-heading text-2xl text-mp-text">Où regarder</h2>
      <div className="flex flex-wrap gap-3">
        {providers.map((provider) => (
          <a
            key={provider.providerId}
            href={link ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-mp-border bg-mp-surface px-3 py-2"
          >
            {provider.logoPath && (
              <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg">
                <Image
                  src={`${TMDB_LOGO_BASE_URL}${provider.logoPath}`}
                  alt={provider.name}
                  fill
                  className="object-cover"
                  sizes="32px"
                />
              </div>
            )}
            <span className="text-sm font-semibold text-mp-text">{provider.name}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
