import { test, expect } from "@playwright/test";
import { findDefaultSeason, type SeasonSummary } from "@/lib/progress";

const seasons: SeasonSummary[] = [
  { season: 1, episodeCount: 8 },
  { season: 2, episodeCount: 10 },
  { season: 3, episodeCount: 6 },
];

test.describe("findDefaultSeason", () => {
  test("retourne la première saison non entièrement vue au milieu de la liste", () => {
    const watchedCounts = new Map([
      [1, 8],
      [2, 4],
      [3, 0],
    ]);
    expect(findDefaultSeason(seasons, watchedCounts)?.season).toBe(2);
  });

  test("retourne la saison partiellement vue", () => {
    const watchedCounts = new Map([[1, 3]]);
    expect(findDefaultSeason(seasons, watchedCounts)?.season).toBe(1);
  });

  test("retombe sur la dernière saison si tout est vu", () => {
    const watchedCounts = new Map([
      [1, 8],
      [2, 10],
      [3, 6],
    ]);
    expect(findDefaultSeason(seasons, watchedCounts)?.season).toBe(3);
  });

  test("retombe sur la première saison si rien n'est vu", () => {
    const watchedCounts = new Map<number, number>();
    expect(findDefaultSeason(seasons, watchedCounts)?.season).toBe(1);
  });

  test("retourne undefined si la liste de saisons est vide", () => {
    expect(findDefaultSeason([], new Map())).toBeUndefined();
  });
});
