-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WatchlistItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mediaId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'TO_WATCH',
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "watchedAt" DATETIME,
    "hiddenFromContinue" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "WatchlistItem_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WatchlistItem_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_WatchlistItem" ("addedAt", "id", "mediaId", "profileId", "status", "watchedAt") SELECT "addedAt", "id", "mediaId", "profileId", "status", "watchedAt" FROM "WatchlistItem";
DROP TABLE "WatchlistItem";
ALTER TABLE "new_WatchlistItem" RENAME TO "WatchlistItem";
CREATE UNIQUE INDEX "WatchlistItem_mediaId_profileId_key" ON "WatchlistItem"("mediaId", "profileId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
