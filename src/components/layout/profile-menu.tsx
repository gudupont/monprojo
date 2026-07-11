"use client";

import { useRouter } from "next/navigation";
import { Users, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface ProfileMenuProps {
  profileName: string;
  profileColor: string;
  avatarClassName?: string;
  showName?: boolean;
}

// Relative luminance (WCAG) decides whether initials render dark or light for AA contrast against profileColor.
function contrastTextColor(hex: string): string {
  const rgb = hex.replace("#", "").match(/.{2}/g)?.map((c) => parseInt(c, 16) / 255) ?? [0, 0, 0];
  const [r, g, b] = rgb.map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  // Crossover where white-on-bg and black-on-bg contrast ratios are equal: L = 0.179.
  return luminance > 0.179 ? "#181004" : "#f3f1ec";
}

export function ProfileMenu({ profileName, profileColor, avatarClassName, showName }: ProfileMenuProps) {
  const router = useRouter();
  const initialsColor = contrastTextColor(profileColor);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Menu profil de ${profileName}`}
        className="flex min-h-11 min-w-11 cursor-pointer items-center gap-2 rounded-full p-2 outline-none"
      >
        <Avatar className={avatarClassName} style={{ backgroundColor: profileColor }}>
          <AvatarFallback style={{ backgroundColor: profileColor, color: initialsColor }} className="text-xs">
            {profileName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {showName && <span className="text-sm text-mp-text-dim">{profileName}</span>}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => router.push("/profiles")}>
          <Users size={16} strokeWidth={1.8} />
          Changer de profil
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut size={16} strokeWidth={1.8} />
          Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
