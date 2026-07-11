"use client";

import { memo, useCallback, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { setProfileProviders } from "@/lib/actions/provider";

const TMDB_LOGO_BASE_URL = "https://image.tmdb.org/t/p/w92";

interface ProviderSelectorProps {
  profileId: string;
  providers: { providerId: number; name: string; logoPath: string | null }[];
  initialSelectedIds: number[];
}

interface ProviderTileProps {
  provider: { providerId: number; name: string; logoPath: string | null };
  checked: boolean;
  onToggle: (providerId: number) => void;
}

const ProviderTile = memo(function ProviderTile({ provider, checked, onToggle }: ProviderTileProps) {
  return (
    <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border border-mp-border bg-mp-surface p-2.5 text-center">
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={() => onToggle(provider.providerId)}
      />
      <div
        className={`relative h-10 w-10 shrink-0 overflow-hidden rounded-lg ${
          checked ? "ring-2 ring-mp-accent" : ""
        }`}
      >
        {provider.logoPath ? (
          <Image
            src={`${TMDB_LOGO_BASE_URL}${provider.logoPath}`}
            alt={provider.name}
            fill
            className="object-cover"
            sizes="40px"
          />
        ) : null}
      </div>
      <span className="text-[11px] text-mp-text-dim">{provider.name}</span>
    </label>
  );
});

export function ProviderSelector({ profileId, providers, initialSelectedIds }: ProviderSelectorProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set(initialSelectedIds));
  const selectedIdsRef = useRef(selectedIds);
  selectedIdsRef.current = selectedIds;
  const [, startTransition] = useTransition();

  const toggle = useCallback(
    (providerId: number) => {
      const next = new Set(selectedIdsRef.current);
      if (next.has(providerId)) {
        next.delete(providerId);
      } else {
        next.add(providerId);
      }
      setSelectedIds(next);
      startTransition(() => {
        setProfileProviders(profileId, Array.from(next));
      });
    },
    [profileId],
  );

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {providers.map((provider) => (
        <ProviderTile
          key={provider.providerId}
          provider={provider}
          checked={selectedIds.has(provider.providerId)}
          onToggle={toggle}
        />
      ))}
    </div>
  );
}
