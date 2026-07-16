import { defineConfig } from "@playwright/test";
import { MOCK_TMDB_PORT } from "./tests/visual/fixtures/mock-tmdb-server";

export default defineConfig({
  testDir: "./tests/visual",
  snapshotDir: "./tests/visual/__screenshots__",
  globalSetup: "./tests/visual/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      animations: "disabled",
    },
  },
  use: {
    baseURL: "http://localhost:3100",
  },
  webServer: {
    command: "npx next dev -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      TMDB_BASE_URL: `http://127.0.0.1:${MOCK_TMDB_PORT}/3`,
    },
  },
});
