import Link from "next/link";
import { Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface MobileTopBarProps {
  profileName: string;
  profileColor: string;
}

export function MobileTopBar({ profileName, profileColor }: MobileTopBarProps) {
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
        <Link href="/search" className="flex text-mp-text">
          <Search size={20} strokeWidth={1.8} />
        </Link>
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
