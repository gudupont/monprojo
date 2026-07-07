import type { Metadata } from "next";
import { Instrument_Serif, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { getActiveProfile } from "@/lib/session";
import { isAuthenticated } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileTopBar } from "@/components/layout/mobile-top-bar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { BfcacheRefresh } from "@/components/bfcache-refresh";

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  style: ["normal", "italic"],
  weight: "400",
  subsets: ["latin"],
});

const bricolageGrotesque = Bricolage_Grotesque({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Monprojo",
  description: "Films et séries à voir en famille, planifiés dans un calendrier partagé",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authenticated = await isAuthenticated();
  const profile = authenticated ? await getActiveProfile() : null;
  const watchlistCount = profile
    ? await db.watchlistItem.count({ where: { profileId: profile.id } })
    : 0;

  return (
    <html
      lang="fr"
      className={`${instrumentSerif.variable} ${bricolageGrotesque.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-mp-bg text-mp-text">
        <BfcacheRefresh />
        {profile ? (
          <div className="flex h-screen w-full flex-col md:flex-row">
            <MobileTopBar profileName={profile.name} profileColor={profile.avatarColor} />
            <Sidebar
              watchlistCount={watchlistCount}
              profileName={profile.name}
              profileColor={profile.avatarColor}
            />
            <main className="flex-1 overflow-y-auto pt-0 pb-[90px] md:pb-0 md:pt-8">
              {children}
            </main>
            <MobileBottomNav />
          </div>
        ) : (
          <main className="flex min-h-full items-center justify-center px-4 py-6">{children}</main>
        )}
      </body>
    </html>
  );
}
