import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { syncProfileFromPlex } from "@/lib/plex-sync";

export async function POST(request: Request) {
  const secret = process.env.PLEX_SYNC_SECRET;
  if (!secret) {
    return new NextResponse("PLEX_SYNC_SECRET n'est pas configuré", { status: 500 });
  }

  const providedSecret =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    new URL(request.url).searchParams.get("token");

  if (providedSecret !== secret) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const profiles = await db.profile.findMany({
    where: {
      OR: [{ plexAccountToken: { not: null } }, { plexServerUrl: { not: null } }],
    },
  });

  const results = await Promise.all(
    profiles.map(async (profile) => {
      try {
        await syncProfileFromPlex(profile);
        await db.profile.update({
          where: { id: profile.id },
          data: { lastPlexSyncAt: new Date(), plexSyncError: null },
        });
        return { profileId: profile.id, status: "ok" as const };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erreur inconnue lors de la synchronisation Plex.";
        await db.profile.update({
          where: { id: profile.id },
          data: { plexSyncError: message },
        });
        return { profileId: profile.id, status: "error" as const, error: message };
      }
    }),
  );

  return NextResponse.json({ results });
}
