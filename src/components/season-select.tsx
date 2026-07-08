"use client";

import { useRouter } from "next/navigation";

interface SeasonSelectProps {
  seasons: { season: number }[];
  activeSeason: number;
}

export function SeasonSelect({ seasons, activeSeason }: SeasonSelectProps) {
  const router = useRouter();

  return (
    <select
      value={activeSeason}
      onChange={(e) => router.replace(`?season=${e.target.value}`)}
      className="rounded-full border border-mp-border bg-mp-surface px-4 py-2 text-[13px] font-semibold text-mp-text focus:border-mp-accent focus:outline-none"
    >
      {seasons.map((s) => (
        <option key={s.season} value={s.season}>
          Saison {s.season}
        </option>
      ))}
    </select>
  );
}
