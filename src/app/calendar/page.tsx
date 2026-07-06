import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { deletePlanEntry } from "@/lib/actions/calendar";
import { Button } from "@/components/ui/button";

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
  const entries = await db.planEntry.findMany({
    where: { scheduledAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    include: { media: true, createdByProfile: true },
    orderBy: { scheduledAt: "asc" },
  });

  return (
    <div className="px-4 pt-5 md:px-10 md:pt-0">
      <h1 className="mb-1.5 font-heading text-[30px] text-mp-text md:text-[38px]">Calendrier</h1>
      <div className="mb-6 text-sm text-mp-text-dim">Les prochaines sorties de tes séries</div>

      {entries.length === 0 && (
        <p className="pb-10 text-sm text-mp-text-dim">
          Rien de planifié pour le moment. Ajoutez une séance depuis la fiche d&apos;un film ou d&apos;une série.
        </p>
      )}

      <div className="flex flex-col gap-3 pb-10">
        {entries.map((entry) => {
          const { day, weekday, isToday } = dateBadge(entry.scheduledAt);
          return (
            <div
              key={entry.id}
              className={`flex items-center gap-4 rounded-2xl border p-4 ${
                isToday ? "border-mp-accent bg-mp-accent/10" : "border-mp-border bg-mp-surface"
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
                {entry.media.poster && (
                  <Image src={entry.media.poster} alt={entry.media.title} fill className="object-cover" sizes="48px" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/media/${entry.media.type.toLowerCase()}/${entry.media.tmdbId}`}
                  className="truncate text-sm font-bold text-mp-text"
                >
                  {entry.media.title} · {entry.media.type === "TV" ? "Série" : "Film"}
                </Link>
                <div className="mt-0.5 text-xs text-mp-text-dim">
                  {entry.scheduledAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} · planifié par{" "}
                  {entry.createdByProfile.name}
                </div>
                {entry.notes && <p className="mt-1 text-xs text-mp-text-dim">{entry.notes}</p>}
              </div>
              <form action={deletePlanEntry.bind(null, entry.id)}>
                <Button type="submit" size="sm" variant="ghost">
                  Retirer
                </Button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
