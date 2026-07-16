import type { PrismaClient } from "@prisma/client";

export async function createVisualProfile(db: PrismaClient, label: string) {
  const name = `Visual QA — ${label}`;
  // Auto-guérison : si un run précédent a crashé avant son afterAll, un profil du
  // même nom (et ses éventuelles données enfants) peut encore exister. On le
  // supprime d'abord (même ordre que deleteVisualProfile, requis par les FK
  // sans onDelete: Cascade sur EpisodeWatch/WatchlistItem/PlanEntry).
  const leftovers = await db.profile.findMany({ where: { name } });
  for (const leftover of leftovers) {
    await deleteVisualProfile(db, leftover.id);
  }
  return db.profile.create({
    data: { name, avatarColor: "#3E6FBF" },
  });
}

export async function deleteVisualProfile(db: PrismaClient, profileId: string | undefined): Promise<void> {
  if (!profileId) return;
  await db.episodeWatch.deleteMany({ where: { profileId } });
  await db.watchlistItem.deleteMany({ where: { profileId } });
  await db.planEntry.deleteMany({ where: { createdByProfileId: profileId } });
  await db.profile.delete({ where: { id: profileId } });
}
