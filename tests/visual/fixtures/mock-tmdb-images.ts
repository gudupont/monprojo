import type { Page } from "@playwright/test";

const TRANSPARENT_PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

export async function mockTmdbImages(page: Page): Promise<void> {
  await page.route("https://image.tmdb.org/**", (route) =>
    route.fulfill({ contentType: "image/png", body: TRANSPARENT_PIXEL_PNG }),
  );
}
