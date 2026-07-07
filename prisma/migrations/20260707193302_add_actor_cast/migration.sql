-- CreateTable
CREATE TABLE "Actor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tmdbId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "profilePath" TEXT
);

-- CreateTable
CREATE TABLE "MediaCast" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mediaId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "character" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "MediaCast_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MediaCast_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Actor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Actor_tmdbId_key" ON "Actor"("tmdbId");

-- CreateIndex
CREATE UNIQUE INDEX "MediaCast_mediaId_actorId_key" ON "MediaCast"("mediaId", "actorId");
