"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/components/layout/nav-items";

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-10 flex h-[78px] items-start gap-0 border-t border-mp-border bg-[#101216] pt-2.5 pb-3.5 md:hidden">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center gap-[3px] px-1 py-1.5 text-[10px] font-semibold ${
              active ? "text-mp-accent" : "text-mp-text-dim"
            }`}
          >
            <Icon size={20} strokeWidth={1.8} />
            <span>{label}</span>
          </Link>
        );
      })}
    </div>
  );
}
