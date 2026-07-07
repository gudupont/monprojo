import type { Media, MediaType, PlanEntry } from "@prisma/client";

const DURATION_MINUTES: Record<MediaType, number> = {
  MOVIE: 120,
  TV: 45,
};

export function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\r?\n/g, "\\n");
}

export function formatICalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

type PlanEntryWithMedia = PlanEntry & { media: Media };

function buildVEvent(entry: PlanEntryWithMedia, now: Date): string {
  const durationMinutes = DURATION_MINUTES[entry.media.type];
  const dtEnd = new Date(entry.scheduledAt.getTime() + durationMinutes * 60 * 1000);

  return [
    "BEGIN:VEVENT",
    `UID:${entry.id}@monprojo`,
    `DTSTAMP:${formatICalDate(now)}`,
    `DTSTART:${formatICalDate(entry.scheduledAt)}`,
    `DTEND:${formatICalDate(dtEnd)}`,
    `SUMMARY:${escapeICalText(entry.media.title)}`,
    "END:VEVENT",
  ].join("\r\n");
}

export function buildVCalendar(planEntries: PlanEntryWithMedia[]): string {
  const now = new Date();
  const lines = [
    "BEGIN:VCALENDAR",
    "PRODID:-//MonProjo//Calendar Subscription//FR",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...planEntries.map((entry) => buildVEvent(entry, now)),
    "END:VCALENDAR",
  ];

  return lines.join("\r\n") + "\r\n";
}
