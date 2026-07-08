import Link from "next/link";
import { redirect } from "next/navigation";
import { getActiveProfile } from "@/lib/session";
import { db } from "@/lib/db";
import { computeProgressPercent } from "@/lib/media-progress";
import { hideFromContinueWatching } from "@/lib/actions/watchlist";
import { MediaCard } from "@/components/media-card";
import { CalendarItem } from "@/components/calendar-item";

const MONTHS_ABBR = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

export default async function Home() {
  const profile = await getActiveProfile();
  if (!profile) redirect("/profiles");

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";
  const today = new Date();
  const todayLabel = `${today.getDate()} ${MONTHS_ABBR[today.getMonth()]} ${today.getFullYear()}`;

  const watchlistItems = await db.watchlistItem.findMany({
    where: { profileId: profile.id },
    include: { media: true },
    orderBy: { addedAt: "desc" },
  });

  const withProgress = await Promise.all(
    watchlistItems.map(async (item) => ({
      item,
      progress: await computeProgressPercent(item.media, profile.id, item.status),
    })),
  );

  const continueItems = withProgress
    .filter(({ item, progress }) => progress > 0 && progress < 100 && !item.hiddenFromContinue)
    .slice(0, 6);
  const watchlistPreview = withProgress.slice(0, 4);

  const upcomingEntries = await db.planEntry.findMany({
    where: { scheduledAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    include: { media: true },
    orderBy: { scheduledAt: "asc" },
    take: 4,
  });

  return (
    <div className="px-4 pt-5 md:px-10 md:pt-0">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <div className="mb-1.5 text-xs uppercase tracking-wide text-mp-text-dim">{todayLabel}</div>
          <h1 className="font-heading text-[30px] text-mp-text md:text-[40px]">{greeting}</h1>
        </div>
      </div>

      {continueItems.length > 0 && (
        <section className="mb-8 md:mb-10">
          <h2 className="mb-4 font-heading text-2xl text-mp-text md:text-[26px]">Continuer à regarder</h2>
          <div className="flex gap-4 no-scrollbar overflow-x-auto pb-1">
            {continueItems.map(({ item, progress }) => (
              <div key={item.id} className="w-44 shrink-0 md:w-48">
                <MediaCard
                  tmdbId={item.media.tmdbId}
                  type={item.media.type}
                  title={item.media.title}
                  poster={item.media.poster}
                  releaseDate={item.media.releaseDate}
                  tmdbRating={item.media.tmdbRating}
                  progressPercent={progress}
                  hoverActions={
                    <form action={hideFromContinueWatching.bind(null, item.id)}>
                      <button
                        type="submit"
                        aria-label="Retirer de « Continuer à regarder »"
                        className="flex size-11 cursor-pointer items-center justify-center rounded-full bg-black/55 text-white outline-none backdrop-blur-sm hover:bg-black/70 focus-visible:ring-2 focus-visible:ring-mp-accent"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </form>
                  }
                />
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="mb-8 flex flex-wrap items-center gap-5 rounded-[18px] bg-mp-surface-2 p-5 ring-1 ring-mp-border md:mb-10 md:p-7">
        <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-mp-accent/15 text-mp-accent">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="4" width="16" height="16" rx="3" />
            <circle cx="9" cy="9" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="15" cy="9" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="9" cy="15" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="15" cy="15" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
          </svg>
        </div>
        <div className="min-w-[180px] flex-1">
          <div className="font-heading text-xl text-mp-text md:text-[22px]">Indécis ce soir ?</div>
          <div className="mt-1 text-[13px] text-mp-text-dim">
            Laisse MonProjo choisir pour toi parmi ta liste et tes goûts.
          </div>
        </div>
        <Link
          href="/decide"
          className="shrink-0 rounded-full bg-mp-accent px-5.5 py-3 text-sm font-bold text-mp-accent-ink"
        >
          Décide pour moi
        </Link>
      </div>

      <section className="mb-8 md:mb-10">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-heading text-2xl text-mp-text md:text-[26px]">Visionnages plannifiés</h2>
          <Link href="/calendar" className="text-[13px] font-semibold text-mp-accent">
            Voir le calendrier
          </Link>
        </div>
        {upcomingEntries.length === 0 ? (
          <p className="text-sm text-mp-text-dim">Rien de planifié pour le moment.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {upcomingEntries.map((entry) => (
              <CalendarItem key={entry.id} date={entry.scheduledAt} media={entry.media} variant="plan" />
            ))}
          </div>
        )}
      </section>

      {watchlistPreview.length > 0 && (
        <section className="mb-8 md:mb-10">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-heading text-2xl text-mp-text md:text-[26px]">Ma liste</h2>
            <Link href="/watchlist" className="text-[13px] font-semibold text-mp-accent">
              Voir tout
            </Link>
          </div>
          <div className="flex gap-4 no-scrollbar overflow-x-auto pb-1">
            {watchlistPreview.map(({ item, progress }) => (
              <div key={item.id} className="w-44 shrink-0 md:w-48">
                <MediaCard
                  tmdbId={item.media.tmdbId}
                  type={item.media.type}
                  title={item.media.title}
                  poster={item.media.poster}
                  releaseDate={item.media.releaseDate}
                  tmdbRating={item.media.tmdbRating}
                  progressPercent={progress}
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
