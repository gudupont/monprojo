"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { ProfileMenu } from "@/components/layout/profile-menu";
import { SearchAutocomplete } from "@/components/search-autocomplete";

interface MobileTopBarProps {
  profileName: string;
  profileColor: string;
}

export function MobileTopBar({ profileName, profileColor }: MobileTopBarProps) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 112 112">
              <rect x="26" y="28" width="60" height="40" rx="8" fill="none" stroke="#0A0B0D" strokeWidth="4"></rect>
              <polygon points="48,40 48,56 64,48" fill="#0A0B0D"></polygon>
              <line x1="30" y1="82" x2="82" y2="82" stroke="#0A0B0D" strokeWidth="4" strokeOpacity="0.35" strokeLinecap="round"></line>
              <line x1="30" y1="82" x2="62" y2="82" stroke="#0A0B0D" strokeWidth="4" strokeLinecap="round"></line>
              <circle cx="62" cy="82" r="5" fill="#0A0B0D"></circle>
            </svg>
          </div>
          <span className="font-heading text-xl italic text-mp-text">MonProjo</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSearchOpen((prev) => !prev)}
            aria-label={searchOpen ? "Fermer la recherche" : "Ouvrir la recherche"}
            aria-expanded={searchOpen}
            className="flex h-11 w-11 shrink-0 items-center justify-center text-mp-text"
          >
            {searchOpen ? <X size={20} strokeWidth={1.8} /> : <Search size={20} strokeWidth={1.8} />}
          </button>
          <ProfileMenu profileName={profileName} profileColor={profileColor} avatarClassName="h-7 w-7" />
        </div>
      </div>

      {searchOpen && (
        <div className="w-full border-b border-mp-border bg-mp-bg px-4 py-3">
          <SearchAutocomplete />
        </div>
      )}
    </div>
  );
}
