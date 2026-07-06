import Link from "next/link";
import { getActiveProfile } from "@/lib/session";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export async function Nav() {
  const profile = await getActiveProfile();

  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold">
          Monprojo
        </Link>
        {profile && (
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/search">Recherche</Link>
            <Link href="/watchlist">Ma watchlist</Link>
            <Link href="/calendar">Calendrier</Link>
            <Link href="/profiles" className="flex items-center gap-2">
              <Avatar className="h-6 w-6" style={{ backgroundColor: profile.avatarColor }}>
                <AvatarFallback style={{ backgroundColor: profile.avatarColor }} className="text-white text-xs">
                  {profile.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {profile.name}
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
