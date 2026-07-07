"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isSearchVisible } from "@/components/layout/nav-items";
import { ProfileMenu } from "@/components/layout/profile-menu";
import { SearchAutocomplete } from "@/components/search-autocomplete";

interface SidebarProps {
  watchlistCount: number;
  profileName: string;
  profileColor: string;
}

export function Sidebar({ watchlistCount, profileName, profileColor }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex h-full w-60 shrink-0 flex-col gap-7 border-r border-mp-border p-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-mp-accent">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#181004">
            <path d="M6 4l14 8-14 8z" />
          </svg>
        </div>
        <span className="font-heading text-xl italic text-mp-text">MonProjo</span>
      </div>

      {isSearchVisible(pathname) && <SearchAutocomplete variant="header" />}

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex w-full items-center gap-3 rounded-[10px] px-3.5 py-2.5 text-sm ${
                active ? "bg-mp-surface-2 font-bold text-mp-text" : "font-medium text-mp-text-dim"
              }`}
            >
              <Icon size={20} strokeWidth={1.8} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        <div className="rounded-xl border border-mp-border bg-mp-surface p-3.5">
          <span className="block font-heading text-[28px] text-mp-accent">{watchlistCount}</span>
          <span className="text-xs text-mp-text-dim">dans ma liste</span>
        </div>
        <div className="flex items-center gap-2 px-1 text-sm text-mp-text-dim">
          <ProfileMenu profileName={profileName} profileColor={profileColor} avatarClassName="h-6 w-6" />
          {profileName}
        </div>
      </div>
    </div>
  );
}
