import type { Media, PlanEntry } from "@prisma/client";

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

export function formatICalDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

type PlanEntryWithMedia = PlanEntry & { media: Media };

function buildVEvent(entry: PlanEntryWithMedia, now: Date): string {
  const dtEnd = new Date(entry.scheduledAt);
  dtEnd.setDate(dtEnd.getDate() + 1);

  return [
    "BEGIN:VEVENT",
    `UID:${entry.id}@monprojo`,
    `DTSTAMP:${formatICalDate(now)}`,
    `DTSTART;VALUE=DATE:${formatICalDateOnly(entry.scheduledAt)}`,
    `DTEND;VALUE=DATE:${formatICalDateOnly(dtEnd)}`,
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
