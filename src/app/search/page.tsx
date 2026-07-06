import { searchMedia } from "@/lib/tmdb";
import { MediaCard } from "@/components/media-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const results = q ? await searchMedia(q) : [];

  return (
    <div className="space-y-6">
      <form className="flex gap-2">
        <Input name="q" defaultValue={q} placeholder="Chercher un film ou une série..." />
        <Button type="submit">Chercher</Button>
      </form>

      {q && results.length === 0 && (
        <p className="text-sm text-muted-foreground">Aucun résultat pour « {q} ».</p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
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
