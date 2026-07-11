import { describe, expect, it } from "vitest";
import { selectReleasedEpisodes, type SeasonSummary } from "@/lib/progress";

const TODAY = "2026-07-08";

describe("selectReleasedEpisodes", () => {
  it("inclut uniquement les épisodes dont la date de diffusion est connue et passée", () => {
    const seasons: SeasonSummary[] = [
      {
        season: 1,
        episodeCount: 3,
        episodes: [
          { episode: 1, title: "Ep1", airDate: "2026-01-01" },
          { episode: 2, title: "Ep2", airDate: "2026-07-08" },
          { episode: 3, title: "Ep3", airDate: "2026-08-01" },
        ],
      },
    ];
    expect(selectReleasedEpisodes(seasons, TODAY)).toEqual([
      { season: 1, episode: 1 },
      { season: 1, episode: 2 },
    ]);
  });

  it("exclut les épisodes sans date de diffusion connue", () => {
    const seasons: SeasonSummary[] = [
      {
        season: 1,
        episodeCount: 1,
        episodes: [{ episode: 1, title: "Ep1", airDate: null }],
      },
    ];
    expect(selectReleasedEpisodes(seasons, TODAY)).toEqual([]);
  });

  it("gère plusieurs saisons et une saison sans détail d'épisodes", () => {
    const seasons: SeasonSummary[] = [
      {
        season: 1,
        episodeCount: 1,
        episodes: [{ episode: 1, title: "Ep1", airDate: "2026-01-01" }],
      },
      { season: 2, episodeCount: 5 },
    ];
    expect(selectReleasedEpisodes(seasons, TODAY)).toEqual([{ season: 1, episode: 1 }]);
  });
});
