-- AlterTable
ALTER TABLE "Profile" ADD COLUMN "calendarToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Profile_calendarToken_key" ON "Profile"("calendarToken");
