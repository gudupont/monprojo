import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { checkPlexLibraryAvailability, findPlexDiscoverItemByTmdbId } from "@/lib/plex";

function searchResponse(results: { ratingKey: string; title: string; type: string; year: number }[]) {
  return {
    MediaContainer: {
      SearchResults: [{ SearchResult: results.map((r) => ({ Metadata: r })) }],
    },
  };
}

function metadataResponse(guidIds: string[]) {
  return {
    MediaContainer: {
      Metadata: [{ ratingKey: "x", guid: "plex://movie/x", Guid: guidIds.map((id) => ({ id })) }],
    },
  };
}

describe("checkPlexLibraryAvailability", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns true when a library item's external Guid array contains the tmdb id", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        MediaContainer: {
          Metadata: [
            {
              ratingKey: "1",
              guid: "plex://movie/6856893830a4aaafd5c4291d",
              Guid: [{ id: "imdb://tt37287335" }, { id: "tmdb://42" }, { id: "tvdb://369536" }],
            },
          ],
        },
      }),
    } as Response);

    const result = await checkPlexLibraryAvailability("http://localhost:32400", "token", 42, "movie");

    expect(result).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/library/all?type=1&includeGuids=1"),
      expect.any(Object),
    );
  });

  it("returns false when no library item's Guid array matches the tmdb id", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        MediaContainer: {
          Metadata: [{ ratingKey: "1", guid: "plex://show/1", Guid: [{ id: "tmdb://999" }] }],
        },
      }),
    } as Response);

    const result = await checkPlexLibraryAvailability("http://localhost:32400", "token", 42, "tv");

    expect(result).toBe(false);
  });

  it("returns false on network error without throwing", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("network down"));

    const result = await checkPlexLibraryAvailability("http://localhost:32400", "token", 42, "movie");

    expect(result).toBe(false);
  });
});

describe("findPlexDiscoverItemByTmdbId", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("disambiguates same-title candidates via the Guid of the matching one", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () =>
          searchResponse([
            { ratingKey: "wrong-1", title: "Obsession", type: "movie", year: 2026 },
            { ratingKey: "right", title: "Obsession", type: "movie", year: 2026 },
          ]),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => metadataResponse(["tmdb://999"]),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => metadataResponse(["tmdb://1339713"]),
      } as Response);

    const result = await findPlexDiscoverItemByTmdbId("acc-token", 1339713, "movie", "Obsession", 2026);

    expect(result).toBe("right");
  });

  it("returns null when no candidate's Guid matches the tmdb id", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => searchResponse([{ ratingKey: "a", title: "Obsession", type: "movie", year: 2026 }]),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => metadataResponse(["tmdb://999"]),
      } as Response);

    const result = await findPlexDiscoverItemByTmdbId("acc-token", 1339713, "movie", "Obsession", 2026);

    expect(result).toBeNull();
  });

  it("returns null on network error without throwing", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("network down"));

    const result = await findPlexDiscoverItemByTmdbId("acc-token", 42, "movie", "Some Movie", 2020);

    expect(result).toBeNull();
  });
});
