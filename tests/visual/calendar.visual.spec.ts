import "dotenv/config";
import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import type { PlanEntry } from "@prisma/client";
import { loginAs } from "./fixtures/auth";
import { mockTmdbImages } from "./fixtures/mock-tmdb-images";
import { createVisualProfile, deleteVisualProfile } from "./fixtures/profile";
import { VIEWPORTS } from "./fixtures/viewports";

const db = new PrismaClient();
const TMDB_ID = 1396;
const BASE_URL = "http://localhost:3100";
const WEEKDAY_REGEX = /^(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)$/;

test.describe("Calendrier - régression visuelle", () => {
  let profileId: string;
  let existingPlanEntries: PlanEntry[] = [];

  test.beforeAll(async () => {
    const media = await db.media.findFirst({ where: { tmdbId: TMDB_ID, type: "TV" } });
    if (!media) {
      throw new Error("Fixture manquante : média Breaking Bad introuvable en base");
    }
    const profile = await createVisualProfile(db, "Calendar");
    profileId = profile.id;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    existingPlanEntries = await db.planEntry.findMany({ where: { scheduledAt: { gte: startOfToday } } });
    await db.planEntry.deleteMany({ where: { id: { in: existingPlanEntries.map((e) => e.id) } } });

    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    await db.planEntry.createMany({
      data: [
        { mediaId: media.id, scheduledAt: today, createdByProfileId: profileId, notes: "Séance test visuel" },
        { mediaId: media.id, scheduledAt: tomorrow, createdByProfileId: profileId, notes: null },
      ],
    });
  });

  test.afterAll(async () => {
    if (profileId) {
      await db.planEntry.deleteMany({ where: { createdByProfileId: profileId } });
      if (existingPlanEntries.length > 0) {
        await db.planEntry.createMany({
          data: existingPlanEntries.map((entry) => ({
            id: entry.id,
            mediaId: entry.mediaId,
            scheduledAt: entry.scheduledAt,
            createdByProfileId: entry.createdByProfileId,
            notes: entry.notes,
            createdAt: entry.createdAt,
          })),
        });
      }
      await deleteVisualProfile(db, profileId);
    }
    await db.$disconnect();
  });

  test.beforeEach(async ({ context, page }) => {
    await loginAs(context, profileId, BASE_URL);
    await mockTmdbImages(page);
  });

  for (const { name, size } of VIEWPORTS) {
    test(`pleine page @ ${name}`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto("/calendar");
      await expect(page.getByText("Séance test visuel")).toBeVisible();
      await expect(page).toHaveScreenshot(`calendar-${name}.png`, {
        fullPage: true,
        mask: [page.locator("span", { hasText: WEEKDAY_REGEX })],
      });
    });
  }
});
