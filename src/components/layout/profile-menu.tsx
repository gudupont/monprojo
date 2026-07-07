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

export function ProfileMenu({ profileName, profileColor, avatarClassName, showName }: ProfileMenuProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex cursor-pointer items-center gap-2 rounded-full outline-none">
        <Avatar className={avatarClassName} style={{ backgroundColor: profileColor }}>
          <AvatarFallback style={{ backgroundColor: profileColor }} className="text-white text-xs">
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
