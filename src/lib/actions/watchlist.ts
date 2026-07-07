"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getActiveProfile } from "@/lib/session";
import { getOrRefreshMedia } from "@/lib/actions/media";
import { pushMediaToPlexWatchlist } from "@/lib/plex-sync";
import type { TmdbMediaType } from "@/lib/tmdb";
import type { WatchStatus } from "@prisma/client";

export type QuickAddResult =
  | { status: "added" }
  | { status: "already-in-watchlist" }
  | { status: "error"; message: string };

export async function quickAddToWatchlist(tmdbId: number, type: TmdbMediaType): Promise<QuickAddResult> {
  const profile = await getActiveProfile();
  if (!profile) return { status: "error", message: "Aucun profil actif" };

  const media = await getOrRefreshMedia(tmdbId, type);

  const existing = await db.watchlistItem.findUnique({
    where: { mediaId_profileId: { mediaId: media.id, profileId: profile.id } },
  });

  await addToWatchlist(media.id);

  return existing ? { status: "already-in-watchlist" } : { status: "added" };
}

export async function addToWatchlist(mediaId: string) {
  const profile = await getActiveProfile();
  if (!profile) throw new Error("Aucun profil actif");

  const existing = await db.watchlistItem.findUnique({
    where: { mediaId_profileId: { mediaId, profileId: profile.id } },
  });

  await db.watchlistItem.upsert({
    where: { mediaId_profileId: { mediaId, profileId: profile.id } },
    create: { mediaId, profileId: profile.id },
    update: {},
  });

  if (!existing) {
    const media = await db.media.findUnique({ where: { id: mediaId } });
    if (media) {
      try {
        await pushMediaToPlexWatchlist(profile, media);
      } catch {
        // best-effort: le push Plex ne doit jamais bloquer l'ajout à la Watchlist MonProjo
      }
    }
  }

  revalidatePath("/watchlist");
}

export async function toggleWatchlist(mediaId: string) {
  const profile = await getActiveProfile();
  if (!profile) throw new Error("Aucun profil actif");

  const existing = await db.watchlistItem.findUnique({
    where: { mediaId_profileId: { mediaId, profileId: profile.id } },
  });

  if (existing) {
    await db.watchlistItem.delete({ where: { id: existing.id } });
  } else {
    await db.watchlistItem.create({ data: { mediaId, profileId: profile.id } });
    const media = await db.media.findUnique({ where: { id: mediaId } });
    if (media) {
      try {
        await pushMediaToPlexWatchlist(profile, media);
      } catch {
        // best-effort: le push Plex ne doit jamais bloquer l'ajout à la Watchlist MonProjo
      }
    }
  }

  revalidatePath("/", "layout");
}

export async function toggleMovieWatched(mediaId: string) {
  const profile = await getActiveProfile();
  if (!profile) throw new Error("Aucun profil actif");

  const existing = await db.watchlistItem.findUnique({
    where: { mediaId_profileId: { mediaId, profileId: profile.id } },
  });

  const nextStatus: WatchStatus = existing?.status === "WATCHED" ? "TO_WATCH" : "WATCHED";

  await db.watchlistItem.upsert({
    where: { mediaId_profileId: { mediaId, profileId: profile.id } },
    create: { mediaId, profileId: profile.id, status: nextStatus },
    update: { status: nextStatus },
  });

  revalidatePath("/", "layout");
}

export async function updateWatchlistStatus(itemId: string, status: WatchStatus) {
  const profile = await getActiveProfile();
  if (!profile) throw new Error("Aucun profil actif");

  await db.watchlistItem.update({
    where: { id: itemId, profileId: profile.id },
    data: { status },
  });

  revalidatePath("/watchlist");
}

export async function removeFromWatchlist(itemId: string) {
  const profile = await getActiveProfile();
  if (!profile) throw new Error("Aucun profil actif");

  await db.watchlistItem.delete({
    where: { id: itemId, profileId: profile.id },
  });

  revalidatePath("/watchlist");
}
