import { db } from "@/lib/db";
import { parseSeasons, totalEpisodes } from "@/lib/progress";
import type { Media, WatchStatus } from "@prisma/client";

function statusFallbackPercent(status: WatchStatus): number {
  if (status === "WATCHED") return 100;
  if (status === "WATCHING") return 50;
  return 0;
}

export async function computeProgressPercent(
  media: Media,
  profileId: string,
  status: WatchStatus,
): Promise<number> {
  if (media.type === "MOVIE") {
    return statusFallbackPercent(status);
  }

  const total = totalEpisodes(parseSeasons(media.seasonsJson));
  if (!total) return statusFallbackPercent(status);

  const watched = await db.episodeWatch.count({ where: { mediaId: media.id, profileId } });
  return Math.round((watched / total) * 100);
}
