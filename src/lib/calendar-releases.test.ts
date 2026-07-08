import { describe, expect, it } from "vitest";
import type { Media, WatchStatus, WatchlistItem } from "@prisma/client";
import { deriveUpcomingReleases } from "@/lib/calendar-releases";

const TODAY = "2026-07-07";

function makeMedia(overrides: Partial<Media>): Media {
  return {
    id: "media-1",
    tmdbId: 1,
    imdbId: null,
    type: "MOVIE",
    title: "Titre",
    poster: null,
    overview: null,
    releaseDate: null,
    tmdbRating: null,
    imdbRating: null,
    genres: null,
    seasonsJson: null,
    watchProvidersJson: null,
    runtimeMinutes: null,
    episodeRuntimeMinutes: null,
    cachedAt: new Date(),
    ...overrides,
  };
}

function makeWatchlistItem(media: Media, status: WatchStatus = "TO_WATCH"): WatchlistItem & { media: Media } {
  return {
    id: `wl-${media.id}`,
    mediaId: media.id,
    profileId: "profile-1",
    status,
    addedAt: new Date(),
    watchedAt: null,
    hiddenFromContinue: false,
    media,
  };
}

describe("deriveUpcomingReleases", () => {
  it("inclut un film à venir de la Watchlist", () => {
    const media = makeMedia({ id: "m-movie", type: "MOVIE", releaseDate: "2026-07-10" });
    const result = deriveUpcomingReleases([makeWatchlistItem(media)], [], TODAY);
    expect(result).toHaveLength(1);
    expect(result[0].media.id).toBe("m-movie");
    expect(result[0].label).toBeNull();
  });

  it("inclut un épisode de série à venir", () => {
    const media = makeMedia({
      id: "m-tv",
      type: "TV",
      seasonsJson: JSON.stringify([
        { season: 1, episodeCount: 2, episodes: [{ episode: 1, title: "Ep1", airDate: "2026-07-08" }] },
      ]),
    });
    const result = deriveUpcomingReleases([makeWatchlistItem(media)], [], TODAY);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("S1E1");
  });

  it("ignore un média hors Watchlist", () => {
    const result = deriveUpcomingReleases([], [], TODAY);
    expect(result).toHaveLength(0);
  });

  it("ignore une sortie passée", () => {
    const media = makeMedia({ id: "m-past", type: "MOVIE", releaseDate: "2026-07-01" });
    const result = deriveUpcomingReleases([makeWatchlistItem(media)], [], TODAY);
    expect(result).toHaveLength(0);
  });

  it("exclut un épisode déjà marqué regardé", () => {
    const media = makeMedia({
      id: "m-watched",
      type: "TV",
      seasonsJson: JSON.stringify([
        { season: 1, episodeCount: 1, episodes: [{ episode: 1, title: "Ep1", airDate: "2026-07-08" }] },
      ]),
    });
    const result = deriveUpcomingReleases(
      [makeWatchlistItem(media)],
      [{ mediaId: "m-watched", season: 1, episode: 1 }],
      TODAY
    );
    expect(result).toHaveLength(0);
  });
});
