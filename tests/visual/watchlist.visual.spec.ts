import "dotenv/config";
import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { loginAs } from "./fixtures/auth";
import { mockTmdbImages } from "./fixtures/mock-tmdb-images";
import { createVisualProfile, deleteVisualProfile } from "./fixtures/profile";
import { VIEWPORTS } from "./fixtures/viewports";

const db = new PrismaClient();
const TMDB_ID = 1396; // Breaking Bad, déjà seedé (voir e2e/season-watch-cascade.spec.ts)
const BASE_URL = "http://localhost:3100";

test.describe("Watchlist - régression visuelle", () => {
  let profileId: string;

  test.beforeAll(async () => {
    const media = await db.media.findFirst({ where: { tmdbId: TMDB_ID, type: "TV" } });
    if (!media) {
      throw new Error("Fixture manquante : média Breaking Bad introuvable en base");
    }
    const profile = await createVisualProfile(db, "Watchlist");
    profileId = profile.id;
    await db.watchlistItem.create({
      data: { mediaId: media.id, profileId, status: "WATCHING" },
    });
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
      await page.goto("/watchlist");
      await expect(page.locator(".group").first()).toBeVisible();
      await expect(page).toHaveScreenshot(`watchlist-${name}.png`, { fullPage: true });
    });
  }

  test("hover première carte @ tablet", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS[1].size);
    await page.goto("/watchlist");
    await page.locator(".group").first().hover();
    await expect(page).toHaveScreenshot("watchlist-hover-tablet.png", { fullPage: true });
  });

  test("hover première carte @ desktop", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS[2].size);
    await page.goto("/watchlist");
    await page.locator(".group").first().hover();
    await expect(page).toHaveScreenshot("watchlist-hover-desktop.png", { fullPage: true });
  });

  test("focus première carte", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS[2].size);
    await page.goto("/watchlist");
    await page.locator('a[href^="/media/"]').first().focus();
    await expect(page).toHaveScreenshot("watchlist-focus-desktop.png", { fullPage: true });
  });
});
