import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { deletePlanEntry } from "@/lib/actions/calendar";
import { getUpcomingReleases } from "@/lib/calendar-releases";
import { getActiveProfile } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { CalendarSubscription } from "@/components/calendar-subscription";
import type { Media, Profile } from "@prisma/client";

interface PlanRow {
  kind: "plan";
  id: string;
  date: Date;
  media: Media;
  notes: string | null;
  createdByProfile: Profile;
}

interface ReleaseRow {
  kind: "release";
  id: string;
  date: Date;
  media: Media;
  label: string | null;
}

type CalendarRow = PlanRow | ReleaseRow;

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

function dateBadge(date: Date) {
  const today = new Date(new Date().setHours(0, 0, 0, 0));
  const diffDays = Math.round((date.getTime() - today.getTime()) / 86400000);
  const isToday = diffDays === 0;
  const day = isToday ? "Aujourd'hui" : diffDays === 1 ? "Demain" : `${date.getDate()} ${MONTHS_ABBR[date.getMonth()]}`;
  const weekday = date.toLocaleDateString("fr-FR", { weekday: "long" });
  return { day, weekday, isToday };
}

export default async function CalendarPage() {
  const profile = await getActiveProfile();

  const [planEntries, releases] = await Promise.all([
    db.planEntry.findMany({
      where: { scheduledAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      include: { media: true, createdByProfile: true },
      orderBy: { scheduledAt: "asc" },
    }),
    profile ? getUpcomingReleases(profile.id) : Promise.resolve([]),
  ]);

  const rows: CalendarRow[] = [
    ...planEntries.map(
      (entry): PlanRow => ({
        kind: "plan",
        id: entry.id,
        date: entry.scheduledAt,
        media: entry.media,
        notes: entry.notes,
        createdByProfile: entry.createdByProfile,
      })
    ),
    ...releases.map(
      (release): ReleaseRow => ({
        kind: "release",
        id: release.id,
        date: release.date,
        media: release.media,
        label: release.label,
      })
    ),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="px-4 pt-5 md:px-10 md:pt-0">
      <h1 className="mb-1.5 font-heading text-[30px] text-mp-text md:text-[38px]">Calendrier</h1>
      <div className="mb-6 text-sm text-mp-text-dim">Les prochaines sorties de tes séries</div>

      <CalendarSubscription />

      {rows.length === 0 && (
        <p className="pb-10 text-sm text-mp-text-dim">
          Rien de planifié pour le moment. Ajoutez une séance depuis la fiche d&apos;un film ou d&apos;une série.
        </p>
      )}

      <div className="flex flex-col gap-3 pb-10">
        {rows.map((row) => {
          const { day, weekday, isToday } = dateBadge(row.date);
          const isRelease = row.kind === "release";
          return (
            <div
              key={row.id}
              className={`flex items-center gap-4 rounded-2xl border p-4 ${
                isToday
                  ? "border-mp-accent bg-mp-accent/10"
                  : isRelease
                    ? "border-dashed border-mp-border bg-mp-surface"
                    : "border-mp-border bg-mp-surface"
              }`}
            >
              <div className="w-[72px] shrink-0 text-center md:w-[88px]">
                <span
                  className={`block whitespace-nowrap font-heading ${isToday ? "text-[15px] text-mp-accent" : "text-2xl text-mp-text"}`}
                >
                  {day}
                </span>
                <span className="text-[11px] uppercase text-mp-text-dim">{weekday}</span>
              </div>
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[10px] bg-mp-surface-2">
                {row.media.poster && (
                  <Image src={row.media.poster} alt={row.media.title} fill className="object-cover" sizes="48px" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/media/${row.media.type.toLowerCase()}/${row.media.tmdbId}`}
                    className="truncate text-sm font-bold text-mp-text"
                  >
                    {row.media.title} · {row.media.type === "TV" ? "Série" : "Film"}
                    {row.kind === "release" && row.label ? ` · ${row.label}` : ""}
                  </Link>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase ${
                      isRelease ? "border-mp-border text-mp-text-dim" : "border-mp-accent text-mp-accent"
                    }`}
                  >
                    {isRelease ? "Sortie" : "Planifié"}
                  </span>
                </div>
                {row.kind === "plan" && (
                  <div className="mt-0.5 text-xs text-mp-text-dim">planifié par {row.createdByProfile.name}</div>
                )}
                {row.kind === "plan" && row.notes && <p className="mt-1 text-xs text-mp-text-dim">{row.notes}</p>}
              </div>
              {row.kind === "plan" && (
                <form action={deletePlanEntry.bind(null, row.id)}>
                  <Button type="submit" size="sm" variant="ghost">
                    Retirer
                  </Button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
