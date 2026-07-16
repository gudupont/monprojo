import { startMockTmdbServer, MOCK_TMDB_PORT } from "./fixtures/mock-tmdb-server";

export default async function globalSetup(): Promise<() => Promise<void>> {
  const server = await startMockTmdbServer(MOCK_TMDB_PORT);
  return async () => {
    await server.close();
  };
}
