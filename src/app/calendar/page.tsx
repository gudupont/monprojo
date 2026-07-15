import { db } from "@/lib/db";
import { getUpcomingReleases } from "@/lib/calendar-releases";
import { getActiveProfile } from "@/lib/session";
import { CalendarSubscription } from "@/components/calendar-subscription";
import { CalendarDayHeader, CalendarItem } from "@/components/calendar-item";
import { RemovePlanButton } from "@/components/remove-plan-button";
import { ReschedulePlanButton } from "@/components/reschedule-plan-button";
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

  const dayGroups: { dayKey: number; date: Date; rows: CalendarRow[] }[] = [];
  for (const row of rows) {
    const dayDate = new Date(row.date);
    dayDate.setHours(0, 0, 0, 0);
    const dayKey = dayDate.getTime();
    const lastGroup = dayGroups[dayGroups.length - 1];
    if (lastGroup && lastGroup.dayKey === dayKey) {
      lastGroup.rows.push(row);
    } else {
      dayGroups.push({ dayKey, date: dayDate, rows: [row] });
    }
  }

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

      <div className="flex flex-col gap-5 pb-10">
        {dayGroups.map((group) => (
          <div key={group.dayKey} className="flex flex-col gap-3">
            <CalendarDayHeader date={group.date} />
            {group.rows.map((row) => (
              <CalendarItem
                key={row.id}
                date={row.date}
                media={row.media}
                variant={row.kind}
                label={row.kind === "release" ? row.label : undefined}
                showDate={false}
                subtitle={
                  row.kind === "plan" && row.notes ? (
                    <p className="mt-1 text-xs text-mp-text-dim">{row.notes}</p>
                  ) : undefined
                }
                actions={
                  row.kind === "plan" ? (
                    <div className="flex items-center gap-1">
                      <ReschedulePlanButton
                        entryId={row.id}
                        title={row.media.title}
                        scheduledAt={row.date}
                      />
                      <RemovePlanButton entryId={row.id} />
                    </div>
                  ) : undefined
                }
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
