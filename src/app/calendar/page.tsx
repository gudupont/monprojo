import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { deletePlanEntry } from "@/lib/actions/calendar";
import { Button } from "@/components/ui/button";

function formatDateKey(date: Date) {
  return date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export default async function CalendarPage() {
  const entries = await db.planEntry.findMany({
    where: { scheduledAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    include: { media: true, createdByProfile: true },
    orderBy: { scheduledAt: "asc" },
  });

  const groups = new Map<string, typeof entries>();
  for (const entry of entries) {
    const key = formatDateKey(entry.scheduledAt);
    const group = groups.get(key) ?? [];
    group.push(entry);
    groups.set(key, group);
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Calendrier du foyer</h1>

      {groups.size === 0 && (
        <p className="text-sm text-muted-foreground">
          Rien de planifié pour le moment. Ajoutez une séance depuis la fiche d&apos;un film ou d&apos;une série.
        </p>
      )}

      {[...groups.entries()].map(([dateLabel, dayEntries]) => (
        <section key={dateLabel} className="space-y-3">
          <h2 className="text-lg font-medium capitalize">{dateLabel}</h2>
          <div className="space-y-2">
            {dayEntries.map((entry) => (
              <div key={entry.id} className="flex items-center gap-4 rounded-lg border p-3">
                <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded bg-muted">
                  {entry.media.poster && (
                    <Image src={entry.media.poster} alt={entry.media.title} fill className="object-cover" sizes="56px" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <Link
                    href={`/media/${entry.media.type.toLowerCase()}/${entry.media.tmdbId}`}
                    className="font-medium"
                  >
                    {entry.media.title}
                  </Link>
                  <div className="text-sm text-muted-foreground">
                    {entry.scheduledAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} · planifié par{" "}
                    {entry.createdByProfile.name}
                  </div>
                  {entry.notes && <p className="text-sm text-muted-foreground">{entry.notes}</p>}
                </div>
                <form action={deletePlanEntry.bind(null, entry.id)}>
                  <Button type="submit" size="sm" variant="ghost">
                    Retirer
                  </Button>
                </form>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
