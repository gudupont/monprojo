import "dotenv/config";
import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { loginAs } from "./fixtures/auth";
import { mockTmdbImages } from "./fixtures/mock-tmdb-images";
import { createVisualProfile, deleteVisualProfile } from "./fixtures/profile";
import { VIEWPORTS } from "./fixtures/viewports";

const db = new PrismaClient();
const TMDB_ID = 1396;
const BASE_URL = "http://localhost:3100";

test.describe("Détail média - régression visuelle", () => {
  let profileId: string;

  test.beforeAll(async () => {
    const media = await db.media.findFirst({ where: { tmdbId: TMDB_ID, type: "TV" } });
    if (!media) {
      throw new Error("Fixture manquante : média Breaking Bad introuvable en base");
    }
    const profile = await createVisualProfile(db, "Detail");
    profileId = profile.id;
  });

  test.afterAll(async () => {
    await deleteVisualProfile(db, profileId);
    await db.$disconnect();
  });

  test.beforeEach(async ({ context, page }) => {
    await loginAs(context, profileId, BASE_URL);
    await mockTmdbImages(page);
  });

  for (const { name, size } of VIEWPORTS) {
    test(`pleine page @ ${name}`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto(`/media/tv/${TMDB_ID}`);
      await expect(page.getByRole("button", { name: /ma liste/ })).toBeVisible();
      await expect(page).toHaveScreenshot(`detail-${name}.png`, { fullPage: true });
    });
  }

  test("hover bouton action principal @ tablet", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS[1].size);
    await page.goto(`/media/tv/${TMDB_ID}`);
    await page.getByRole("button", { name: /ma liste/ }).hover();
    await expect(page).toHaveScreenshot("detail-hover-tablet.png", { fullPage: true });
  });

  test("hover bouton action principal @ desktop", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS[2].size);
    await page.goto(`/media/tv/${TMDB_ID}`);
    await page.getByRole("button", { name: /ma liste/ }).hover();
    await expect(page).toHaveScreenshot("detail-hover-desktop.png", { fullPage: true });
  });

  test("focus bouton action principal", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS[2].size);
    await page.goto(`/media/tv/${TMDB_ID}`);
    await page.getByRole("button", { name: /ma liste/ }).focus();
    await expect(page).toHaveScreenshot("detail-focus-desktop.png", { fullPage: true });
  });
});
