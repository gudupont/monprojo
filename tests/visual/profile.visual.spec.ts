import "dotenv/config";
import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { loginAs } from "./fixtures/auth";
import { mockTmdbImages } from "./fixtures/mock-tmdb-images";
import { deleteVisualProfile } from "./fixtures/profile";
import { VIEWPORTS } from "./fixtures/viewports";

const db = new PrismaClient();
const BASE_URL = "http://localhost:3100";

test.describe("Profil - régression visuelle", () => {
  let activeProfileId: string;
  let secondaryProfileId: string;
  let createdSecondary = false;

  test.beforeAll(async () => {
    // Auto-guérison : si un run précédent a crashé avant son afterAll, un profil
    // "Visual QA — Profile secondaire" orphelin peut traîner en base. On le
    // supprime d'abord pour ne pas fausser la logique "réutiliser le 2e profil".
    const stale = await db.profile.findMany({ where: { name: "Visual QA — Profile secondaire" } });
    for (const s of stale) {
      await deleteVisualProfile(db, s.id);
    }

    const profiles = await db.profile.findMany({ orderBy: { createdAt: "asc" } });
    if (profiles.length === 0) {
      throw new Error("Fixture manquante : aucun profil en base");
    }
    activeProfileId = profiles[0].id;

    if (profiles[1]) {
      secondaryProfileId = profiles[1].id;
    } else {
      const created = await db.profile.create({
        data: { name: "Visual QA — Profile secondaire", avatarColor: "#7C5CBF" },
      });
      secondaryProfileId = created.id;
      createdSecondary = true;
    }
  });

  test.afterAll(async () => {
    if (createdSecondary) {
      await deleteVisualProfile(db, secondaryProfileId);
    }
    await db.$disconnect();
  });

  test.beforeEach(async ({ context, page }) => {
    await loginAs(context, activeProfileId, BASE_URL);
    await mockTmdbImages(page);
  });

  for (const { name, size } of VIEWPORTS) {
    test(`pleine page @ ${name}`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto("/profiles");
      await expect(page.getByRole("heading", { name: "Qui regarde ?" })).toBeVisible();
      await expect(page).toHaveScreenshot(`profile-${name}.png`, { fullPage: true });
    });
  }

  test("hover avatar secondaire @ tablet", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS[1].size);
    await page.goto("/profiles");
    await page.getByRole("button", { name: /Passer au profil/ }).first().hover();
    await expect(page).toHaveScreenshot("profile-hover-tablet.png", { fullPage: true });
  });

  test("hover avatar secondaire @ desktop", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS[2].size);
    await page.goto("/profiles");
    await page.getByRole("button", { name: /Passer au profil/ }).first().hover();
    await expect(page).toHaveScreenshot("profile-hover-desktop.png", { fullPage: true });
  });

  test("focus avatar secondaire", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS[2].size);
    await page.goto("/profiles");
    await page.getByRole("button", { name: /Passer au profil/ }).first().focus();
    await expect(page).toHaveScreenshot("profile-focus-desktop.png", { fullPage: true });
  });
});
