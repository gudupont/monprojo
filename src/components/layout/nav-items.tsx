import { Home, Search, Bookmark, Calendar, Dices } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/search", label: "Recherche", icon: Search },
  { href: "/watchlist", label: "Ma liste", icon: Bookmark },
  { href: "/calendar", label: "Calendrier", icon: Calendar },
  { href: "/decide", label: "Décider", icon: Dices },
] as const;
