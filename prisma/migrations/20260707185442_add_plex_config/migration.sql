-- AlterTable
ALTER TABLE "Profile" ADD COLUMN "lastPlexSyncAt" DATETIME;
ALTER TABLE "Profile" ADD COLUMN "plexAccountToken" TEXT;
ALTER TABLE "Profile" ADD COLUMN "plexServerToken" TEXT;
ALTER TABLE "Profile" ADD COLUMN "plexServerUrl" TEXT;
ALTER TABLE "Profile" ADD COLUMN "plexSyncError" TEXT;
