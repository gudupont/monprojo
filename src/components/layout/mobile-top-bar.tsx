"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { ProfileMenu } from "@/components/layout/profile-menu";
import { SearchAutocomplete } from "@/components/search-autocomplete";
import { isSearchVisible } from "@/components/layout/nav-items";

interface MobileTopBarProps {
  profileName: string;
  profileColor: string;
}

export function MobileTopBar({ profileName, profileColor }: MobileTopBarProps) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchVisible = isSearchVisible(pathname);

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

  return (
    <div ref={containerRef} className="sticky top-0 z-10 shrink-0 md:hidden">
      <div className="flex h-14 items-center justify-between border-b border-mp-border bg-mp-bg px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[7px] bg-mp-accent">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#181004" aria-hidden="true">
              <path d="M6 4l14 8-14 8z" />
            </svg>
          </div>
          <span className="font-heading text-xl italic text-mp-text">MonProjo</span>
        </div>
        <div className="flex items-center gap-1">
          {searchVisible ? (
            <button
              type="button"
              onClick={() => setSearchOpen((prev) => !prev)}
              aria-label={searchOpen ? "Fermer la recherche" : "Ouvrir la recherche"}
              aria-expanded={searchOpen}
              className="flex h-11 w-11 shrink-0 items-center justify-center text-mp-text"
            >
              {searchOpen ? <X size={20} strokeWidth={1.8} /> : <Search size={20} strokeWidth={1.8} />}
            </button>
          ) : (
            <Link
              href="/search"
              aria-label="Recherche"
              className="flex h-11 w-11 shrink-0 items-center justify-center text-mp-text"
            >
              <Search size={20} strokeWidth={1.8} />
            </Link>
          )}
          <ProfileMenu profileName={profileName} profileColor={profileColor} avatarClassName="h-7 w-7" />
        </div>
      </div>

      {searchOpen && searchVisible && (
        <div className="w-full border-b border-mp-border bg-mp-bg px-4 py-3">
          <SearchAutocomplete variant="header" />
        </div>
      )}
    </div>
  );
}
