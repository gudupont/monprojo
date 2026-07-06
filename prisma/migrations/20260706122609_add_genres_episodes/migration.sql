-- AlterTable
ALTER TABLE "Media" ADD COLUMN "genres" TEXT;
ALTER TABLE "Media" ADD COLUMN "seasonsJson" TEXT;

-- CreateTable
CREATE TABLE "EpisodeWatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mediaId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "season" INTEGER NOT NULL,
    "episode" INTEGER NOT NULL,
    "watchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EpisodeWatch_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EpisodeWatch_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "EpisodeWatch_mediaId_profileId_season_episode_key" ON "EpisodeWatch"("mediaId", "profileId", "season", "episode");
