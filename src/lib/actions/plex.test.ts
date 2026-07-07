import { describe, it, expect, vi, beforeEach } from "vitest";
import { savePlexConfig, getPlexStatus } from "@/lib/actions/plex";
import { testPlexAccountConnection, testPlexServerConnection } from "@/lib/plex";
import { db } from "@/lib/db";

vi.mock("@/lib/plex", () => ({
  testPlexAccountConnection: vi.fn(),
  testPlexServerConnection: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    profile: {
      update: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("savePlexConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves a valid full config (account + server)", async () => {
    vi.mocked(testPlexAccountConnection).mockResolvedValue(true);
    vi.mocked(testPlexServerConnection).mockResolvedValue(true);

    const result = await savePlexConfig("profile-1", "acc-token", "http://localhost:32400", "srv-token");

    expect(result.success).toBe(true);
    expect(db.profile.update).toHaveBeenCalledWith({
      where: { id: "profile-1" },
      data: {
        plexAccountToken: "acc-token",
        plexServerUrl: "http://localhost:32400",
        plexServerToken: "srv-token",
        plexSyncError: null,
      },
    });
  });

  it("rejects an invalid account token without saving", async () => {
    vi.mocked(testPlexAccountConnection).mockResolvedValue(false);

    const result = await savePlexConfig("profile-1", "bad-token", "", "");

    expect(result.success).toBe(false);
    expect(db.profile.update).not.toHaveBeenCalled();
  });

  it("saves a partial config (account only, no server)", async () => {
    vi.mocked(testPlexAccountConnection).mockResolvedValue(true);

    const result = await savePlexConfig("profile-1", "acc-token", "", "");

    expect(result.success).toBe(true);
    expect(testPlexServerConnection).not.toHaveBeenCalled();
    expect(db.profile.update).toHaveBeenCalledWith({
      where: { id: "profile-1" },
      data: {
        plexAccountToken: "acc-token",
        plexServerUrl: null,
        plexServerToken: null,
        plexSyncError: null,
      },
    });
  });

  it("rejects when server url/token are provided only partially", async () => {
    vi.mocked(testPlexAccountConnection).mockResolvedValue(true);

    const result = await savePlexConfig("profile-1", "acc-token", "http://localhost:32400", "");

    expect(result.success).toBe(false);
    expect(db.profile.update).not.toHaveBeenCalled();
  });
});

describe("getPlexStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reflects config presence, last sync date and error", async () => {
    const lastSync = new Date("2026-01-01T00:00:00Z");
    vi.mocked(db.profile.findUnique).mockResolvedValue({
      plexAccountToken: "acc",
      plexServerUrl: "http://localhost:32400",
      plexServerToken: "srv",
      lastPlexSyncAt: lastSync,
      plexSyncError: "boom",
    } as never);

    const status = await getPlexStatus("profile-1");

    expect(status).toEqual({
      hasAccountConfig: true,
      hasServerConfig: true,
      lastSyncAt: lastSync,
      syncError: "boom",
    });
  });

  it("reports absent config", async () => {
    vi.mocked(db.profile.findUnique).mockResolvedValue(null);

    const status = await getPlexStatus("profile-1");

    expect(status).toEqual({
      hasAccountConfig: false,
      hasServerConfig: false,
      lastSyncAt: null,
      syncError: null,
    });
  });
});
