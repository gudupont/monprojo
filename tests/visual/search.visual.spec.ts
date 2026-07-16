import "dotenv/config";
import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { loginAs } from "./fixtures/auth";
import { createVisualProfile, deleteVisualProfile } from "./fixtures/profile";
import { VIEWPORTS } from "./fixtures/viewports";

const db = new PrismaClient();
const BASE_URL = "http://localhost:3100";

test.describe("Recherche - régression visuelle", () => {
  let profileId: string;

  test.beforeAll(async () => {
    const profile = await createVisualProfile(db, "Search");
    profileId = profile.id;
  });

  test.afterAll(async () => {
    await deleteVisualProfile(db, profileId);
    await db.$disconnect();
  });

  test.beforeEach(async ({ context }) => {
    await loginAs(context, profileId, BASE_URL);
  });

  for (const { name, size } of VIEWPORTS) {
    test(`pleine page @ ${name}`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto("/search?q=matrix");
      await expect(page.getByText("2 résultats")).toBeVisible();
      await expect(page).toHaveScreenshot(`search-${name}.png`, { fullPage: true });
    });
  }

  test("hover première carte @ tablet", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS[1].size);
    await page.goto("/search?q=matrix");
    await page.locator(".group").first().hover();
    await expect(page).toHaveScreenshot("search-hover-tablet.png", { fullPage: true });
  });

  test("hover première carte @ desktop", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS[2].size);
    await page.goto("/search?q=matrix");
    await page.locator(".group").first().hover();
    await expect(page).toHaveScreenshot("search-hover-desktop.png", { fullPage: true });
  });

  test("focus première carte", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS[2].size);
    await page.goto("/search?q=matrix");
    await page.locator('a[href^="/media/"]').first().focus();
    await expect(page).toHaveScreenshot("search-focus-desktop.png", { fullPage: true });
  });
});
