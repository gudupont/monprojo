import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  syncProfileWatchlistFromPlex,
  syncProfileWatchedStatusFromPlex,
  pushMediaToPlexWatchlist,
} from "@/lib/plex-sync";
import {
  getPlexAccountWatchlist,
  getPlexServerWatchedMovies,
  getPlexServerWatchedEpisodes,
  findPlexDiscoverItemByTmdbId,
  addToPlexAccountWatchlist,
} from "@/lib/plex";
import { resolvePlexItemToMedia, resolveTmdbIdFromGuids } from "@/lib/plex-resolve";
import { db } from "@/lib/db";
import type { Media, Profile } from "@prisma/client";

vi.mock("@/lib/plex", () => ({
  getPlexAccountWatchlist: vi.fn(),
  getPlexServerWatchedMovies: vi.fn(),
  getPlexServerWatchedEpisodes: vi.fn(),
  findPlexDiscoverItemByTmdbId: vi.fn(),
  addToPlexAccountWatchlist: vi.fn(),
}));

vi.mock("@/lib/plex-resolve", () => ({
  resolvePlexItemToMedia: vi.fn(),
  resolveTmdbIdFromGuids: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    profile: { update: vi.fn() },
    media: { findUnique: vi.fn() },
    watchlistItem: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    episodeWatch: { upsert: vi.fn() },
  },
}));

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "profile-1",
    name: "Guillaume",
    avatarColor: "#000",
    radarrUrl: null,
    radarrApiKey: null,
    sonarrUrl: null,
    sonarrApiKey: null,
    plexAccountToken: "acc-token",
    plexServerUrl: "http://localhost:32400",
    plexServerToken: "srv-token",
    lastPlexSyncAt: null,
    plexSyncError: null,
    calendarToken: null,
    createdAt: new Date(),
    ...overrides,
  };
}

function makeMedia(overrides: Partial<Media> = {}): Media {
  return {
    id: "media-1",
    tmdbId: 42,
    imdbId: null,
    type: "MOVIE",
    title: "Some Movie",
    poster: null,
    overview: null,
    releaseDate: null,
    tmdbRating: null,
    imdbRating: null,
    genres: null,
    seasonsJson: null,
    watchProvidersJson: null,
    cachedAt: new Date(),
    ...overrides,
  };
}

describe("syncProfileWatchlistFromPlex", () => {
  beforeEach(() => vi.clearAllMocks());

  it("adds a new item resolved from the Plex Watchlist", async () => {
    const profile = makeProfile();
    const media = makeMedia();
    vi.mocked(getPlexAccountWatchlist).mockResolvedValue([
      { ratingKey: "1", guid: "g", title: "Some Movie", year: 2020, type: "movie", externalGuids: [] },
    ]);
    vi.mocked(resolvePlexItemToMedia).mockResolvedValue(media);
    vi.mocked(db.watchlistItem.findUnique).mockResolvedValue(null);

    await syncProfileWatchlistFromPlex(profile);

    expect(db.watchlistItem.create).toHaveBeenCalledWith({
      data: { mediaId: media.id, profileId: profile.id, status: "TO_WATCH" },
    });
  });

  it("does not duplicate an item already present in the MonProjo watchlist", async () => {
    const profile = makeProfile();
    const media = makeMedia();
    vi.mocked(getPlexAccountWatchlist).mockResolvedValue([
      { ratingKey: "1", guid: "g", title: "Some Movie", year: 2020, type: "movie", externalGuids: [] },
    ]);
    vi.mocked(resolvePlexItemToMedia).mockResolvedValue(media);
    vi.mocked(db.watchlistItem.findUnique).mockResolvedValue({ id: "existing" } as never);

    await syncProfileWatchlistFromPlex(profile);

    expect(db.watchlistItem.create).not.toHaveBeenCalled();
  });

  it("silently skips an item that cannot be resolved to a Media", async () => {
    const profile = makeProfile();
    vi.mocked(getPlexAccountWatchlist).mockResolvedValue([
      { ratingKey: "1", guid: "g", title: "Unknown", year: null, type: "movie", externalGuids: [] },
    ]);
    vi.mocked(resolvePlexItemToMedia).mockResolvedValue(null);

    await expect(syncProfileWatchlistFromPlex(profile)).resolves.not.toThrow();
    expect(db.watchlistItem.create).not.toHaveBeenCalled();
  });

  it("does nothing when the profile has no account token", async () => {
    const profile = makeProfile({ plexAccountToken: null });
    await syncProfileWatchlistFromPlex(profile);
    expect(getPlexAccountWatchlist).not.toHaveBeenCalled();
  });
});

describe("syncProfileWatchedStatusFromPlex", () => {
  beforeEach(() => vi.clearAllMocks());

  it("marks a watched movie as WATCHED", async () => {
    const profile = makeProfile();
    const media = makeMedia();
    vi.mocked(getPlexServerWatchedMovies).mockResolvedValue([
      { guid: "g", externalGuids: [], title: "Some Movie", year: 2020 },
    ]);
    vi.mocked(getPlexServerWatchedEpisodes).mockResolvedValue([]);
    vi.mocked(resolveTmdbIdFromGuids).mockResolvedValue(media.tmdbId);
    vi.mocked(db.media.findUnique).mockResolvedValue(media);
    vi.mocked(db.watchlistItem.findUnique).mockResolvedValue({ id: "wl-1", status: "TO_WATCH" } as never);

    await syncProfileWatchedStatusFromPlex(profile);

    expect(db.watchlistItem.update).toHaveBeenCalledWith({
      where: { id: "wl-1" },
      data: { status: "WATCHED" },
    });
  });

  it("is idempotent when the movie is already WATCHED", async () => {
    const profile = makeProfile();
    const media = makeMedia();
    vi.mocked(getPlexServerWatchedMovies).mockResolvedValue([
      { guid: "g", externalGuids: [], title: "Some Movie", year: 2020 },
    ]);
    vi.mocked(getPlexServerWatchedEpisodes).mockResolvedValue([]);
    vi.mocked(resolveTmdbIdFromGuids).mockResolvedValue(media.tmdbId);
    vi.mocked(db.media.findUnique).mockResolvedValue(media);
    vi.mocked(db.watchlistItem.findUnique).mockResolvedValue({ id: "wl-1", status: "WATCHED" } as never);

    await syncProfileWatchedStatusFromPlex(profile);

    expect(db.watchlistItem.update).not.toHaveBeenCalled();
  });

  it("creates an EpisodeWatch entry for a watched episode", async () => {
    const profile = makeProfile();
    const media = makeMedia({ id: "media-tv", tmdbId: 99, type: "TV" });
    vi.mocked(getPlexServerWatchedMovies).mockResolvedValue([]);
    vi.mocked(getPlexServerWatchedEpisodes).mockResolvedValue([
      { showGuid: "g", showExternalGuids: [], showTitle: "Some Show", season: 1, episode: 2 },
    ]);
    vi.mocked(resolveTmdbIdFromGuids).mockResolvedValue(media.tmdbId);
    vi.mocked(db.media.findUnique).mockResolvedValue(media);
    vi.mocked(db.watchlistItem.findUnique).mockResolvedValue({ id: "wl-2" } as never);

    await syncProfileWatchedStatusFromPlex(profile);

    expect(db.episodeWatch.upsert).toHaveBeenCalledWith({
      where: {
        mediaId_profileId_season_episode: {
          mediaId: media.id,
          profileId: profile.id,
          season: 1,
          episode: 2,
        },
      },
      create: { mediaId: media.id, profileId: profile.id, season: 1, episode: 2 },
      update: {},
    });
  });

  it("does not touch an episode whose show is not in the profile's watchlist", async () => {
    const profile = makeProfile();
    const media = makeMedia({ id: "media-tv", tmdbId: 99, type: "TV" });
    vi.mocked(getPlexServerWatchedMovies).mockResolvedValue([]);
    vi.mocked(getPlexServerWatchedEpisodes).mockResolvedValue([
      { showGuid: "g", showExternalGuids: [], showTitle: "Some Show", season: 1, episode: 2 },
    ]);
    vi.mocked(resolveTmdbIdFromGuids).mockResolvedValue(media.tmdbId);
    vi.mocked(db.media.findUnique).mockResolvedValue(media);
    vi.mocked(db.watchlistItem.findUnique).mockResolvedValue(null);

    await syncProfileWatchedStatusFromPlex(profile);

    expect(db.episodeWatch.upsert).not.toHaveBeenCalled();
  });

  it("isolates two profiles with different Plex accounts", async () => {
    const profileA = makeProfile({ id: "profile-a", plexServerUrl: "http://server-a", plexServerToken: "token-a" });
    const profileB = makeProfile({ id: "profile-b", plexServerUrl: "http://server-b", plexServerToken: "token-b" });
    const media = makeMedia();

    vi.mocked(getPlexServerWatchedMovies).mockImplementation(async (url) =>
      url === "http://server-a" ? [{ guid: "g", externalGuids: [], title: "Some Movie", year: 2020 }] : [],
    );
    vi.mocked(getPlexServerWatchedEpisodes).mockResolvedValue([]);
    vi.mocked(resolveTmdbIdFromGuids).mockResolvedValue(media.tmdbId);
    vi.mocked(db.media.findUnique).mockResolvedValue(media);
    vi.mocked(db.watchlistItem.findUnique).mockResolvedValue({ id: "wl-1", status: "TO_WATCH" } as never);

    await syncProfileWatchedStatusFromPlex(profileA);
    await syncProfileWatchedStatusFromPlex(profileB);

    expect(getPlexServerWatchedMovies).toHaveBeenCalledWith("http://server-a", "token-a");
    expect(getPlexServerWatchedMovies).toHaveBeenCalledWith("http://server-b", "token-b");
    expect(db.watchlistItem.update).toHaveBeenCalledTimes(1);
  });
});

describe("pushMediaToPlexWatchlist", () => {
  beforeEach(() => vi.clearAllMocks());

  it("resolves the Plex Discover item and adds it to the account watchlist", async () => {
    const profile = makeProfile();
    const media = makeMedia();
    vi.mocked(findPlexDiscoverItemByTmdbId).mockResolvedValue("rating-key-1");

    await pushMediaToPlexWatchlist(profile, media);

    expect(findPlexDiscoverItemByTmdbId).toHaveBeenCalledWith(profile.plexAccountToken, media.tmdbId, "movie");
    expect(addToPlexAccountWatchlist).toHaveBeenCalledWith(profile.plexAccountToken, "rating-key-1");
  });

  it("does nothing when the profile has no account token configured", async () => {
    const profile = makeProfile({ plexAccountToken: null });
    const media = makeMedia();

    await pushMediaToPlexWatchlist(profile, media);

    expect(findPlexDiscoverItemByTmdbId).not.toHaveBeenCalled();
    expect(addToPlexAccountWatchlist).not.toHaveBeenCalled();
  });

  it("does not add to the watchlist when the item is not found on Plex Discover", async () => {
    const profile = makeProfile();
    const media = makeMedia();
    vi.mocked(findPlexDiscoverItemByTmdbId).mockResolvedValue(null);

    await expect(pushMediaToPlexWatchlist(profile, media)).resolves.not.toThrow();
    expect(addToPlexAccountWatchlist).not.toHaveBeenCalled();
  });

  it("swallows errors and records plexSyncError without throwing", async () => {
    const profile = makeProfile();
    const media = makeMedia();
    vi.mocked(findPlexDiscoverItemByTmdbId).mockRejectedValue(new Error("timeout"));

    await expect(pushMediaToPlexWatchlist(profile, media)).resolves.not.toThrow();
    expect(db.profile.update).toHaveBeenCalledWith({
      where: { id: profile.id },
      data: { plexSyncError: "timeout" },
    });
  });
});
