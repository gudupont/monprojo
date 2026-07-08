import { db } from "@/lib/db";
import { getOrRefreshMedia } from "@/lib/actions/media";
import { computeProgressPercent } from "@/lib/media-progress";
import type { WatchStatus } from "@prisma/client";

const THROTTLE_MS = 250;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function nextWatchStatus(
  currentStatus: WatchStatus,
  percent: number,
): { status: WatchStatus; watchedAt: Date | null } | null {
  if (percent === 100 && currentStatus !== "WATCHED") {
    return { status: "WATCHED", watchedAt: new Date() };
  }
  if (percent < 100 && currentStatus === "WATCHED") {
    return { status: "WATCHING", watchedAt: null };
  }
  return null;
}

export async function refreshWatchlistNightly() {
  const items = await db.watchlistItem.findMany({
    where: { media: { type: "TV" } },
    include: { media: true },
  });

  const mediaById = new Map(items.map((item) => [item.mediaId, item.media]));

  for (const media of mediaById.values()) {
    try {
      await getOrRefreshMedia(media.tmdbId, "tv", { force: true });
    } catch (error) {
      console.error(`[refreshWatchlistNightly] échec refresh série tmdbId=${media.tmdbId}`, error);
    }
    await delay(THROTTLE_MS);
  }

  const refreshedMediaById = new Map(
    (
      await db.media.findMany({ where: { id: { in: Array.from(mediaById.keys()) } } })
    ).map((media) => [media.id, media]),
  );

  for (const item of items) {
    const media = refreshedMediaById.get(item.mediaId) ?? item.media;
    const percent = await computeProgressPercent(media, item.profileId, item.status);
    const next = nextWatchStatus(item.status, percent);

    if (next) {
      await db.watchlistItem.update({
        where: { id: item.id },
        data: next,
      });
    }
  }
}
