export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const globalForCron = globalThis as unknown as { __watchlistCronStarted?: boolean };
  if (globalForCron.__watchlistCronStarted) return;
  globalForCron.__watchlistCronStarted = true;

  const cron = await import("node-cron");
  const { refreshWatchlistNightly } = await import("@/lib/cron/refresh-watchlist");

  cron.schedule("0 4 * * *", () => {
    refreshWatchlistNightly().catch((error) => {
      console.error("[instrumentation] échec refreshWatchlistNightly", error);
    });
  });
}
