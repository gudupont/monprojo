import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolvePlexTmdbId } from "@/lib/plex-resolve";
import { findByImdbId, searchMediaByTitleAndYear } from "@/lib/tmdb";
import type { PlexWatchlistItem } from "@/lib/plex";

vi.mock("@/lib/tmdb", () => ({
  findByImdbId: vi.fn(),
  searchMediaByTitleAndYear: vi.fn(),
}));

vi.mock("@/lib/actions/media", () => ({
  getOrRefreshMedia: vi.fn(),
}));

function makeItem(overrides: Partial<PlexWatchlistItem> = {}): PlexWatchlistItem {
  return {
    ratingKey: "1",
    guid: "plex://movie/1",
    title: "Some Movie",
    year: 2020,
    type: "movie",
    externalGuids: [],
    ...overrides,
  };
}

describe("resolvePlexTmdbId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("extracts tmdbId directly from guid without calling TMDb", async () => {
    const item = makeItem({ externalGuids: ["imdb://tt123", "tmdb://456"] });
    const tmdbId = await resolvePlexTmdbId(item);
    expect(tmdbId).toBe(456);
    expect(findByImdbId).not.toHaveBeenCalled();
    expect(searchMediaByTitleAndYear).not.toHaveBeenCalled();
  });

  it("falls back to IMDb lookup when no tmdb guid is present", async () => {
    vi.mocked(findByImdbId).mockResolvedValue({
      tmdbId: 789,
      type: "movie",
      title: "Some Movie",
      poster: null,
      overview: null,
      releaseDate: "2020-01-01",
      tmdbRating: null,
    });
    const item = makeItem({ externalGuids: ["imdb://tt999"] });
    const tmdbId = await resolvePlexTmdbId(item);
    expect(tmdbId).toBe(789);
    expect(findByImdbId).toHaveBeenCalledWith("tt999");
  });

  it("falls back to title+year search when no external guid resolves", async () => {
    vi.mocked(searchMediaByTitleAndYear).mockResolvedValue({
      tmdbId: 321,
      type: "movie",
      title: "Some Movie",
      poster: null,
      overview: null,
      releaseDate: "2020-01-01",
      tmdbRating: null,
    });
    const item = makeItem({ externalGuids: [] });
    const tmdbId = await resolvePlexTmdbId(item);
    expect(tmdbId).toBe(321);
    expect(searchMediaByTitleAndYear).toHaveBeenCalledWith("Some Movie", 2020, "movie");
  });

  it("returns null when nothing resolves", async () => {
    vi.mocked(searchMediaByTitleAndYear).mockResolvedValue(null);
    const item = makeItem({ externalGuids: [] });
    const tmdbId = await resolvePlexTmdbId(item);
    expect(tmdbId).toBeNull();
  });
});
