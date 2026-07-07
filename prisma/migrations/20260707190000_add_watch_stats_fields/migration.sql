-- AlterTable
ALTER TABLE "Media" ADD COLUMN "runtimeMinutes" INTEGER;
ALTER TABLE "Media" ADD COLUMN "episodeRuntimeMinutes" INTEGER;

-- AlterTable
ALTER TABLE "WatchlistItem" ADD COLUMN "watchedAt" DATETIME;
