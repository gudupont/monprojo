"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/components/layout/nav-items";
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
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 112 112">
            <rect width="112" height="112" fill="#E8A33D"></rect>
            <rect x="26" y="28" width="60" height="40" rx="8" fill="none" stroke="#0A0B0D" stroke-width="4"></rect>
            <polygon points="48,40 48,56 64,48" fill="#0A0B0D"></polygon>
            <line x1="30" y1="82" x2="82" y2="82" stroke="#262A31" stroke-width="4" stroke-linecap="round"></line>
            <line x1="30" y1="82" x2="62" y2="82" stroke="#0A0B0D" stroke-width="4" stroke-linecap="round"></line>
            <circle cx="62" cy="82" r="5" fill="#0A0B0D"></circle>
          </svg>
        </div>
        <span className="font-heading text-xl italic text-mp-text">MonProjo</span>
      </div>

      <SearchAutocomplete />

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
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
          <ProfileMenu profileName={profileName} profileColor={profileColor} avatarClassName="h-6 w-6" showName />
        </div>
      </div>
    </div>
  );
}
