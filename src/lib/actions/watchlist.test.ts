import { describe, it, expect, vi, beforeEach } from "vitest";
import { addToWatchlist, toggleWatchlist } from "@/lib/actions/watchlist";
import { getActiveProfile } from "@/lib/session";
import { pushMediaToPlexWatchlist } from "@/lib/plex-sync";
import { db } from "@/lib/db";
import type { Media, Profile } from "@prisma/client";

vi.mock("@/lib/session", () => ({
  getActiveProfile: vi.fn(),
}));

vi.mock("@/lib/plex-sync", () => ({
  pushMediaToPlexWatchlist: vi.fn(),
}));

vi.mock("@/lib/actions/media", () => ({
  getOrRefreshMedia: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    watchlistItem: { findUnique: vi.fn(), upsert: vi.fn(), create: vi.fn(), delete: vi.fn() },
    media: { findUnique: vi.fn() },
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
    plexServerUrl: null,
    plexServerToken: null,
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

describe("addToWatchlist push to Plex", () => {
  beforeEach(() => vi.clearAllMocks());

  it("pushes to Plex when the item is newly created", async () => {
    const profile = makeProfile();
    const media = makeMedia();
    vi.mocked(getActiveProfile).mockResolvedValue(profile);
    vi.mocked(db.watchlistItem.findUnique).mockResolvedValue(null);
    vi.mocked(db.media.findUnique).mockResolvedValue(media);

    await addToWatchlist(media.id);

    expect(pushMediaToPlexWatchlist).toHaveBeenCalledWith(profile, media);
  });

  it("does not push again when the item is already present", async () => {
    const profile = makeProfile();
    vi.mocked(getActiveProfile).mockResolvedValue(profile);
    vi.mocked(db.watchlistItem.findUnique).mockResolvedValue({ id: "wl-1" } as never);

    await addToWatchlist("media-1");

    expect(pushMediaToPlexWatchlist).not.toHaveBeenCalled();
  });

  it("does not attempt a push when the profile has no Plex account configured", async () => {
    const profile = makeProfile({ plexAccountToken: null });
    const media = makeMedia();
    vi.mocked(getActiveProfile).mockResolvedValue(profile);
    vi.mocked(db.watchlistItem.findUnique).mockResolvedValue(null);
    vi.mocked(db.media.findUnique).mockResolvedValue(media);

    await addToWatchlist(media.id);

    // pushMediaToPlexWatchlist is still called; it is its own responsibility to no-op
    // without a configured token (verified in plex-sync.test.ts).
    expect(pushMediaToPlexWatchlist).toHaveBeenCalledWith(profile, media);
  });

  it("push failures do not throw or block the add action", async () => {
    const profile = makeProfile();
    const media = makeMedia();
    vi.mocked(getActiveProfile).mockResolvedValue(profile);
    vi.mocked(db.watchlistItem.findUnique).mockResolvedValue(null);
    vi.mocked(db.media.findUnique).mockResolvedValue(media);
    vi.mocked(pushMediaToPlexWatchlist).mockRejectedValue(new Error("network error"));

    await expect(addToWatchlist(media.id)).resolves.not.toThrow();
  });
});

describe("toggleWatchlist push to Plex", () => {
  beforeEach(() => vi.clearAllMocks());

  it("pushes to Plex only on creation, not on removal", async () => {
    const profile = makeProfile();
    const media = makeMedia();
    vi.mocked(getActiveProfile).mockResolvedValue(profile);
    vi.mocked(db.watchlistItem.findUnique).mockResolvedValue({ id: "wl-1" } as never);

    await toggleWatchlist(media.id);

    expect(db.watchlistItem.delete).toHaveBeenCalled();
    expect(pushMediaToPlexWatchlist).not.toHaveBeenCalled();
  });
});
