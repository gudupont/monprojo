import { describe, expect, it, vi } from "vitest";
import type { Media } from "@prisma/client";

const findManyMock = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    episodeWatch: {
      findMany: (...args: unknown[]) => findManyMock(...args),
    },
  },
}));

const { computeProgressPercent, computeProgressPercentBatch } = await import("@/lib/media-progress");

function makeSeriesMedia(episodeCount: number): Media {
  return {
    id: "media-1",
    type: "TV",
    seasonsJson: JSON.stringify([{ season: 1, episodeCount }]),
  } as unknown as Media;
}

describe("computeProgressPercent", () => {
  it("reste strictement sous 100% quand un seul épisode manque sur une grande série", async () => {
    const total = 1122;
    findManyMock.mockResolvedValueOnce(
      Array.from({ length: total - 1 }, (_, i) => ({ season: 1, episode: i + 1 })),
    );

    const percent = await computeProgressPercent(makeSeriesMedia(total), "profile-1", "WATCHING");

    expect(percent).toBeLessThan(100);
  });

  it("vaut 100% quand watched === total sur une grande série", async () => {
    const total = 1122;
    findManyMock.mockResolvedValueOnce(
      Array.from({ length: total }, (_, i) => ({ season: 1, episode: i + 1 })),
    );

    const percent = await computeProgressPercent(makeSeriesMedia(total), "profile-1", "WATCHED");

    expect(percent).toBe(100);
  });
});

describe("computeProgressPercentBatch", () => {
  it("reste strictement sous 100% quand un seul épisode manque sur une grande série", async () => {
    const total = 1122;
    findManyMock.mockResolvedValueOnce(
      Array.from({ length: total - 1 }, (_, i) => ({ mediaId: "media-1", season: 1, episode: i + 1 })),
    );

    const result = await computeProgressPercentBatch(
      [{ media: makeSeriesMedia(total), status: "WATCHING" }],
      "profile-1",
    );

    expect(result.get("media-1")).toBeLessThan(100);
  });

  it("vaut 100% quand watched === total sur une grande série", async () => {
    const total = 1122;
    findManyMock.mockResolvedValueOnce(
      Array.from({ length: total }, (_, i) => ({ mediaId: "media-1", season: 1, episode: i + 1 })),
    );

    const result = await computeProgressPercentBatch(
      [{ media: makeSeriesMedia(total), status: "WATCHED" }],
      "profile-1",
    );

    expect(result.get("media-1")).toBe(100);
  });
});
