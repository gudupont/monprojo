-- AlterTable
ALTER TABLE "Media" ADD COLUMN "watchProvidersJson" TEXT;

-- CreateTable
CREATE TABLE "Provider" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "logoPath" TEXT
);

-- CreateTable
CREATE TABLE "ProfileProvider" (
    "profileId" TEXT NOT NULL,
    "providerId" INTEGER NOT NULL,
    CONSTRAINT "ProfileProvider_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProfileProvider_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ProfileProvider_profileId_providerId_key" ON "ProfileProvider"("profileId", "providerId");
