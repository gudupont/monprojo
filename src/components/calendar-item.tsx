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
  showDate?: boolean;
}

export function CalendarDayHeader({ date }: { date: Date }) {
  const { day, weekday, isToday } = dateBadge(date);
  return (
    <div className="flex items-baseline gap-2 px-1">
      <span className={`font-heading ${isToday ? "text-[15px] text-mp-accent" : "text-2xl text-mp-text"}`}>
        {day}
      </span>
      <span className="text-[11px] uppercase text-mp-text-dim">{weekday}</span>
    </div>
  );
}

export function CalendarItem({ date, media, variant, label, subtitle, actions, showDate = true }: CalendarItemProps) {
  const { day, weekday, isToday } = dateBadge(date);
  const isRelease = variant === "release";

  return (
    <div
      className={`relative flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border p-4 ${
        isToday
          ? "border-mp-accent bg-mp-accent/10"
          : isRelease
            ? "border-dashed border-mp-border bg-mp-surface"
            : "border-mp-border bg-mp-surface"
      }`}
    >
      {showDate && (
        <div className="w-16 shrink-0 text-center sm:w-[72px] md:w-[88px]">
          <span
            className={`block whitespace-nowrap font-heading ${isToday ? "text-[15px] text-mp-accent" : "text-2xl text-mp-text"}`}
          >
            {day}
          </span>
          <span className="text-[11px] uppercase text-mp-text-dim">{weekday}</span>
        </div>
      )}
      <div className="relative aspect-[2/3] h-14 shrink-0 overflow-hidden rounded-[10px] bg-mp-surface-2 sm:h-[72px] md:h-[88px]">
        {media.poster && (
          <Image
            src={media.poster}
            alt={media.title}
            fill
            className="object-cover"
            sizes="(min-width: 768px) 59px, (min-width: 640px) 48px, 37px"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/media/${media.type.toLowerCase()}/${media.tmdbId}`}
            className="line-clamp-2 text-sm font-bold text-mp-text after:absolute after:inset-0"
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
      {actions && <div className="relative z-10 ml-auto shrink-0">{actions}</div>}
    </div>
  );
}
