import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "@/app/api/sync/plex/route";
import { syncProfileFromPlex } from "@/lib/plex-sync";
import { db } from "@/lib/db";
import type { Profile } from "@prisma/client";

vi.mock("@/lib/plex-sync", () => ({
  syncProfileFromPlex: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    profile: { findMany: vi.fn(), update: vi.fn() },
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
    plexAccountToken: "acc",
    plexServerUrl: null,
    plexServerToken: null,
    lastPlexSyncAt: null,
    plexSyncError: null,
    calendarToken: null,
    createdAt: new Date(),
    ...overrides,
  };
}

describe("POST /api/sync/plex", () => {
  const originalSecret = process.env.PLEX_SYNC_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PLEX_SYNC_SECRET = "super-secret";
  });

  afterEach(() => {
    process.env.PLEX_SYNC_SECRET = originalSecret;
  });

  it("rejects requests without a valid secret", async () => {
    const request = new Request("http://localhost/api/sync/plex", { method: "POST" });
    const response = await POST(request);
    expect(response.status).toBe(401);
    expect(db.profile.findMany).not.toHaveBeenCalled();
  });

  it("isolates profile failures: one broken profile does not affect the others", async () => {
    const profileA = makeProfile({ id: "profile-a" });
    const profileB = makeProfile({ id: "profile-b" });
    vi.mocked(db.profile.findMany).mockResolvedValue([profileA, profileB]);
    vi.mocked(syncProfileFromPlex).mockImplementation(async (profile) => {
      if (profile.id === "profile-a") throw new Error("Plex injoignable");
    });

    const request = new Request("http://localhost/api/sync/plex?token=super-secret", { method: "POST" });
    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(db.profile.update).toHaveBeenCalledWith({
      where: { id: "profile-a" },
      data: { plexSyncError: "Plex injoignable" },
    });
    expect(db.profile.update).toHaveBeenCalledWith({
      where: { id: "profile-b" },
      data: { lastPlexSyncAt: expect.any(Date), plexSyncError: null },
    });
  });

  it("accepts the secret via the Authorization header", async () => {
    vi.mocked(db.profile.findMany).mockResolvedValue([]);
    const request = new Request("http://localhost/api/sync/plex", {
      method: "POST",
      headers: { Authorization: "Bearer super-secret" },
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});
