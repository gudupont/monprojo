"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getActiveProfile } from "@/lib/session";
import type { WatchStatus } from "@prisma/client";

export async function addToWatchlist(mediaId: string) {
  const profile = await getActiveProfile();
  if (!profile) throw new Error("Aucun profil actif");

  await db.watchlistItem.upsert({
    where: { mediaId_profileId: { mediaId, profileId: profile.id } },
    create: { mediaId, profileId: profile.id },
    update: {},
  });

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
