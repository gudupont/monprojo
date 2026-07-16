import type { PrismaClient } from "@prisma/client";

export async function createVisualProfile(db: PrismaClient, label: string) {
  return db.profile.create({
    data: { name: `Visual QA — ${label}`, avatarColor: "#3E6FBF" },
  });
}

export async function deleteVisualProfile(db: PrismaClient, profileId: string): Promise<void> {
  await db.episodeWatch.deleteMany({ where: { profileId } });
  await db.watchlistItem.deleteMany({ where: { profileId } });
  await db.planEntry.deleteMany({ where: { createdByProfileId: profileId } });
  await db.profile.delete({ where: { id: profileId } });
}
