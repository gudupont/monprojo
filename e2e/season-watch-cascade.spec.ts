import "dotenv/config";
import { test, expect } from "@playwright/test";
import { SignJWT } from "jose";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const TMDB_ID = 1396; // Breaking Bad, 5 saisons
const MEDIA_TYPE = "tv";

async function signSession(): Promise<string> {
  const secret = new TextEncoder().encode(process.env.SESSION_SECRET);
  return new SignJWT({ authenticated: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + 60 * 60)
    .sign(secret);
}

test.describe("Confirmation de cascade sur les saisons précédentes", () => {
  let mediaId: string;
  let profileId: string;

  test.beforeAll(async () => {
    const media = await db.media.findFirst({ where: { tmdbId: TMDB_ID, type: "TV" } });
    const profile = await db.profile.findFirst();
    if (!media || !profile) {
      throw new Error("Fixtures manquantes : media Breaking Bad ou profil introuvable en base");
    }
    mediaId = media.id;
    profileId = profile.id;
  });

  test.beforeEach(async ({ page, context }) => {
    await db.episodeWatch.deleteMany({ where: { mediaId, profileId } });
    // Saison 1 partiellement vue (3/7) pour déclencher la cascade sur la saison 2.
    await db.episodeWatch.createMany({
      data: [1, 2, 3].map((episode) => ({ mediaId, profileId, season: 1, episode })),
    });

    const token = await signSession();
    await context.addCookies([
      { name: "monprojo_session", value: token, url: "http://localhost:3000" },
      { name: "monprojo_profile_id", value: profileId, url: "http://localhost:3000" },
    ]);

    await page.goto(`/media/${MEDIA_TYPE}/${TMDB_ID}?season=2`);
  });

  test.afterAll(async () => {
    await db.episodeWatch.deleteMany({ where: { mediaId, profileId } });
    await db.$disconnect();
  });

  test("annuler la modale ne modifie aucun état", async ({ page }) => {
    await page.getByRole("button", { name: "Marquer la saison comme vue" }).click();
    await expect(page.getByText("Saison 1 sera également marquée(s) comme vue(s)")).toBeVisible();

    await page.getByRole("button", { name: "Annuler" }).click();
    await expect(page.getByText("Saison 1 sera également")).not.toBeVisible();

    const watches = await db.episodeWatch.findMany({ where: { mediaId, profileId } });
    expect(watches).toHaveLength(3);
  });

  test("valider la modale marque la saison courante et les saisons précédentes concernées", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Marquer la saison comme vue" }).click();
    await page.getByRole("button", { name: "Valider" }).click();

    await expect(page.getByRole("button", { name: "Marquer la saison comme non vue" })).toBeVisible();

    const watches = await db.episodeWatch.findMany({ where: { mediaId, profileId } });
    const bySeason = watches.reduce<Record<number, number>>((acc, w) => {
      acc[w.season] = (acc[w.season] ?? 0) + 1;
      return acc;
    }, {});
    expect(bySeason[1]).toBe(7);
    expect(bySeason[2]).toBe(13);
  });

  test("aucune saison précédente concernée : action directe sans modale", async ({ page }) => {
    await page.goto(`/media/${MEDIA_TYPE}/${TMDB_ID}?season=1`);
    await page.getByRole("button", { name: "Marquer la saison comme vue" }).click();

    await expect(page.getByRole("button", { name: "Marquer la saison comme non vue" })).toBeVisible();
    const watches = await db.episodeWatch.findMany({ where: { mediaId, profileId, season: 1 } });
    expect(watches).toHaveLength(7);
  });
});
