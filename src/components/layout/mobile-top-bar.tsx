"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SearchAutocomplete } from "@/components/search-autocomplete";
import { SEARCH_VISIBLE_PATHS } from "@/components/layout/nav-items";

interface MobileTopBarProps {
  profileName: string;
  profileColor: string;
}

export function MobileTopBar({ profileName, profileColor }: MobileTopBarProps) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchVisible = SEARCH_VISIBLE_PATHS.includes(pathname as (typeof SEARCH_VISIBLE_PATHS)[number]);

  useEffect(() => {
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!searchOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSearchOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [searchOpen]);

  if (searchOpen && searchVisible) {
    return (
      <div
        ref={containerRef}
        className="sticky top-0 z-10 flex h-14 shrink-0 items-center border-b border-mp-border bg-mp-bg px-4 md:hidden"
      >
        <SearchAutocomplete variant="header" />
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-mp-border bg-mp-bg px-4 md:hidden">
      <div className="flex items-center gap-2.5">
        <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[7px] bg-mp-accent">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#181004">
            <path d="M6 4l14 8-14 8z" />
          </svg>
        </div>
        <span className="font-heading text-xl italic text-mp-text">MonProjo</span>
      </div>
      <div className="flex items-center gap-4">
        {searchVisible ? (
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Ouvrir la recherche"
            className="flex text-mp-text"
          >
            <Search size={20} strokeWidth={1.8} />
          </button>
        ) : (
          <Link href="/search" className="flex text-mp-text">
            <Search size={20} strokeWidth={1.8} />
          </Link>
        )}
        <Link href="/profiles" className="flex">
          <Avatar className="h-6 w-6" style={{ backgroundColor: profileColor }}>
            <AvatarFallback style={{ backgroundColor: profileColor }} className="text-white text-xs">
              {profileName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </div>
  );
}
