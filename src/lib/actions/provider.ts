"use server";

import { db } from "@/lib/db";
import { getAvailableProviders } from "@/lib/tmdb";
import { revalidatePath } from "next/cache";

export async function getProfileProviders(profileId: string): Promise<number[]> {
  const rows = await db.profileProvider.findMany({ where: { profileId } });
  return rows.map((r) => r.providerId);
}

export async function setProfileProviders(profileId: string, providerIds: number[]): Promise<void> {
  const available = await getAvailableProviders();
  const availableById = new Map(available.map((p) => [p.providerId, p]));

  const validIds = providerIds.filter((id) => availableById.has(id));

  await db.$transaction([
    ...validIds.map((id) => {
      const provider = availableById.get(id)!;
      return db.provider.upsert({
        where: { id: provider.providerId },
        create: { id: provider.providerId, name: provider.name, logoPath: provider.logoPath },
        update: { name: provider.name, logoPath: provider.logoPath },
      });
    }),
    db.profileProvider.deleteMany({ where: { profileId } }),
    ...validIds.map((id) =>
      db.profileProvider.create({ data: { profileId, providerId: id } }),
    ),
  ]);

  revalidatePath("/profiles");
}
