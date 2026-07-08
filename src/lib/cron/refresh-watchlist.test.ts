import { describe, expect, it } from "vitest";
import { nextWatchStatus } from "@/lib/cron/refresh-watchlist";

describe("nextWatchStatus", () => {
  it("passe à WATCHED avec watchedAt quand la progression atteint 100%", () => {
    const result = nextWatchStatus("WATCHING", 100);
    expect(result?.status).toBe("WATCHED");
    expect(result?.watchedAt).toBeInstanceOf(Date);
  });

  it("repasse à WATCHING avec watchedAt=null si un nouvel épisode fait retomber sous 100%", () => {
    const result = nextWatchStatus("WATCHED", 80);
    expect(result).toEqual({ status: "WATCHING", watchedAt: null });
  });

  it("ne change rien si la progression reste stable en dessous de 100%", () => {
    expect(nextWatchStatus("WATCHING", 50)).toBeNull();
  });

  it("ne change rien si déjà WATCHED et toujours à 100%", () => {
    expect(nextWatchStatus("WATCHED", 100)).toBeNull();
  });

  it("ne change rien pour TO_WATCH tant que la progression n'atteint pas 100%", () => {
    expect(nextWatchStatus("TO_WATCH", 0)).toBeNull();
  });
});
