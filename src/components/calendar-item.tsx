import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Media } from "@prisma/client";

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

export function dateBadge(date: Date) {
  const today = new Date(new Date().setHours(0, 0, 0, 0));
  const diffDays = Math.round((date.getTime() - today.getTime()) / 86400000);
  const isToday = diffDays === 0;
  const day = isToday ? "Aujourd'hui" : diffDays === 1 ? "Demain" : `${date.getDate()} ${MONTHS_ABBR[date.getMonth()]}`;
  const weekday = date.toLocaleDateString("fr-FR", { weekday: "long" });
  return { day, weekday, isToday };
}

interface CalendarItemProps {
  date: Date;
  media: Pick<Media, "poster" | "title" | "type" | "tmdbId">;
  variant: "plan" | "release";
  label?: string | null;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

export function CalendarItem({ date, media, variant, label, subtitle, actions }: CalendarItemProps) {
  const { day, weekday, isToday } = dateBadge(date);
  const isRelease = variant === "release";

  return (
    <div
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
        {media.poster && <Image src={media.poster} alt={media.title} fill className="object-cover" sizes="48px" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            href={`/media/${media.type.toLowerCase()}/${media.tmdbId}`}
            className="truncate text-sm font-bold text-mp-text"
          >
            {media.title} · {media.type === "TV" ? "Série" : "Film"}
            {isRelease && label ? ` · ${label}` : ""}
          </Link>
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase ${
              isRelease ? "border-mp-border text-mp-text-dim" : "border-mp-accent text-mp-accent"
            }`}
          >
            {isRelease ? "Sortie" : "Planifié"}
          </span>
        </div>
        {subtitle}
      </div>
      {actions}
    </div>
  );
}
