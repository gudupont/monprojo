# Harnais de régression visuelle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Doter MonProjo d'un harnais de régression visuelle CLI (`@playwright/test`) qui capture Watchlist, Détail, Calendrier, Profil et Recherche à 3 largeurs + états hover/focus, compare pixel-à-pixel à des baselines versionnées, et échoue bruyamment (>1% delta) via une commande `/verify-visual`.

**Architecture:** Config Playwright dédiée (`playwright.visual.config.ts`, testDir `tests/visual/`) séparée du config e2e existant, serveur Next.js dev isolé sur le port 3100 (évite tout conflit avec un `npm run dev` déjà lancé), auth par cookie JWT injecté (comme `e2e/season-watch-cascade.spec.ts`), profils Prisma éphémères créés/détruits par test pour garantir un contenu déterministe, mock réseau pour TMDb (images côté navigateur via `page.route`, API JSON côté serveur via un petit serveur HTTP mock + `TMDB_BASE_URL` paramétrable).

**Tech Stack:** `@playwright/test` 1.61 (déjà en dépendance), Prisma Client, `jose` (JWT), Node `http` natif (mock serveur, aucune nouvelle dépendance).

## Global Constraints

- Viewports exacts : mobile 375×812, tablette 768×1024, desktop 1280×800.
- Seuil de diff : `maxDiffPixelRatio: 0.01` (1%), configuré globalement dans `playwright.visual.config.ts`.
- Baselines committées dans `tests/visual/__screenshots__/` (jamais dans `test-results/`, déjà gitignoré).
- Canal CLI uniquement (`@playwright/test`) — jamais les outils MCP Playwright interactifs pour ce harnais.
- Auth : cookie JWT injecté via `context.addCookies`, jamais le vrai formulaire `/login` (règle MCP hors scope ici).
- Aucune donnée de développement existante n'est modifiée de façon irréversible : tout profil/plan-entry créé pour un test est supprimé en `afterAll` ; toute donnée globale existante temporairement retirée (calendrier) est restaurée à l'identique.
- Zéro dépendance réseau externe pendant les tests : TMDb JSON mocké via un serveur HTTP local, images TMDb mockées via `page.route`.
- Locale de contenu : `fr-FR` (l'app est en français, les assertions de texte le reflètent).

---

## Task 1 : Infrastructure partagée + surface Watchlist

**Files:**
- Modify: `src/lib/tmdb.ts:1`
- Modify: `package.json` (section `scripts`)
- Create: `playwright.visual.config.ts`
- Create: `tests/visual/global-setup.ts`
- Create: `tests/visual/fixtures/viewports.ts`
- Create: `tests/visual/fixtures/auth.ts`
- Create: `tests/visual/fixtures/profile.ts`
- Create: `tests/visual/fixtures/mock-tmdb-images.ts`
- Create: `tests/visual/fixtures/mock-tmdb-server.ts`
- Create: `tests/visual/watchlist.visual.spec.ts`
- Create (générés par Playwright) : `tests/visual/__screenshots__/watchlist.visual.spec.ts-snapshots/*.png`

**Interfaces:**
- Produces (utilisé par toutes les tâches suivantes) :
  - `VIEWPORTS: { name: "mobile" | "tablet" | "desktop"; size: { width: number; height: number } }[]` — `tests/visual/fixtures/viewports.ts`
  - `loginAs(context: BrowserContext, profileId: string, baseURL: string): Promise<void>` — `tests/visual/fixtures/auth.ts`
  - `createVisualProfile(db: PrismaClient, label: string): Promise<Profile>` et `deleteVisualProfile(db: PrismaClient, profileId: string): Promise<void>` — `tests/visual/fixtures/profile.ts`
  - `mockTmdbImages(page: Page): Promise<void>` — `tests/visual/fixtures/mock-tmdb-images.ts`
  - `MOCK_TMDB_PORT: number` et `startMockTmdbServer(port?: number): Promise<{ close: () => Promise<void> }>` — `tests/visual/fixtures/mock-tmdb-server.ts`
  - Constante partagée `BASE_URL = "http://localhost:3100"` (répétée littéralement dans chaque spec, pas de module partagé pour ça — trivial et plus lisible qu'un import de plus)

- [ ] **Step 1: Paramétrer `TMDB_BASE_URL` pour pouvoir le mocker en test**

Modifier `src/lib/tmdb.ts:1` :

```ts
const TMDB_BASE_URL = process.env.TMDB_BASE_URL ?? "https://api.themoviedb.org/3";
```

(Remplace la ligne `const TMDB_BASE_URL = "https://api.themoviedb.org/3";`. Comportement inchangé en prod/dev tant que `TMDB_BASE_URL` n'est pas défini.)

- [ ] **Step 2: Créer les viewports partagés**

`tests/visual/fixtures/viewports.ts` :

```ts
export interface Viewport {
  name: "mobile" | "tablet" | "desktop";
  size: { width: number; height: number };
}

export const VIEWPORTS: Viewport[] = [
  { name: "mobile", size: { width: 375, height: 812 } },
  { name: "tablet", size: { width: 768, height: 1024 } },
  { name: "desktop", size: { width: 1280, height: 800 } },
];
```

- [ ] **Step 3: Créer le helper d'authentification**

`tests/visual/fixtures/auth.ts` :

```ts
import { SignJWT } from "jose";
import type { BrowserContext } from "@playwright/test";

export async function loginAs(
  context: BrowserContext,
  profileId: string,
  baseURL: string,
): Promise<void> {
  const secret = new TextEncoder().encode(process.env.SESSION_SECRET);
  const token = await new SignJWT({ authenticated: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + 60 * 60)
    .sign(secret);

  await context.addCookies([
    { name: "monprojo_session", value: token, url: baseURL },
    { name: "monprojo_profile_id", value: profileId, url: baseURL },
  ]);
}
```

- [ ] **Step 4: Créer le helper de profil éphémère**

`tests/visual/fixtures/profile.ts` :

```ts
import type { PrismaClient } from "@prisma/client";

export async function createVisualProfile(db: PrismaClient, label: string) {
  return db.profile.create({
    data: { name: `Visual QA — ${label}`, avatarColor: "#3E6FBF" },
  });
}

export async function deleteVisualProfile(db: PrismaClient, profileId: string): Promise<void> {
  await db.episodeWatch.deleteMany({ where: { profileId } });
  await db.watchlistItem.deleteMany({ where: { profileId } });
  await db.planEntry.deleteMany({ where: { createdByProfileId: profileId } });
  await db.profile.delete({ where: { id: profileId } });
}
```

- [ ] **Step 5: Créer le mock d'images TMDb (côté navigateur)**

`tests/visual/fixtures/mock-tmdb-images.ts` :

```ts
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
```

*Pourquoi :* `next/image` charge les posters depuis `image.tmdb.org` **dans le navigateur** — `page.route` intercepte bien ces requêtes. Un pixel transparent uniforme rend le rendu déterministe (pas d'artefacts JPEG variables) sans dépendre du réseau.

- [ ] **Step 6: Créer le mock serveur TMDb (côté serveur Next.js)**

`tests/visual/fixtures/mock-tmdb-server.ts` :

```ts
import http from "node:http";

export const MOCK_TMDB_PORT = 4599;

const SEARCH_MULTI_RESPONSE = {
  results: [
    {
      id: 603,
      media_type: "movie",
      title: "Matrix",
      poster_path: null,
      overview: "Un pirate informatique découvre la vérité sur sa réalité.",
      release_date: "1999-03-30",
      vote_average: 8.2,
    },
    {
      id: 1396,
      media_type: "tv",
      name: "Breaking Bad",
      poster_path: null,
      overview: "Un professeur de chimie bascule dans le trafic de drogue.",
      first_air_date: "2008-01-20",
      vote_average: 8.9,
    },
  ],
};

export function startMockTmdbServer(port: number = MOCK_TMDB_PORT): Promise<{ close: () => Promise<void> }> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((_req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(SEARCH_MULTI_RESPONSE));
    });
    server.once("error", reject);
    server.listen(port, () => {
      resolve({
        close: () => new Promise<void>((res2) => server.close(() => res2())),
      });
    });
  });
}
```

*Pourquoi un serveur distinct plutôt que `page.route` :* `searchMedia()` (`src/lib/tmdb.ts`) s'exécute **dans le processus serveur Next.js** (Server Component), pas dans le navigateur — `page.route` ne peut pas intercepter cet appel. On redirige donc `TMDB_BASE_URL` vers ce mock local pour le processus `next dev` lancé par Playwright.

- [ ] **Step 7: Créer le globalSetup Playwright**

`tests/visual/global-setup.ts` :

```ts
import { startMockTmdbServer, MOCK_TMDB_PORT } from "./fixtures/mock-tmdb-server";

export default async function globalSetup(): Promise<() => Promise<void>> {
  const server = await startMockTmdbServer(MOCK_TMDB_PORT);
  return async () => {
    await server.close();
  };
}
```

- [ ] **Step 8: Créer le config Playwright dédié**

`playwright.visual.config.ts` :

```ts
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
```

*Pourquoi le port 3100 et `reuseExistingServer: false` :* un `npm run dev` du développeur tourne souvent déjà sur le port 3000 (voir CLAUDE.md) — un port dédié + un process toujours frais garantit que `TMDB_BASE_URL` est bien appliqué à chaque run, sans jamais risquer de piloter le serveur de dev habituel du développeur.

- [ ] **Step 9: Ajouter les scripts npm**

Modifier `package.json`, section `scripts` :

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "test:visual": "playwright test --config=playwright.visual.config.ts",
    "test:visual:update": "playwright test --config=playwright.visual.config.ts --update-snapshots"
  },
```

- [ ] **Step 10: Écrire le spec Watchlist**

`tests/visual/watchlist.visual.spec.ts` :

```ts
import "dotenv/config";
import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { loginAs } from "./fixtures/auth";
import { mockTmdbImages } from "./fixtures/mock-tmdb-images";
import { createVisualProfile, deleteVisualProfile } from "./fixtures/profile";
import { VIEWPORTS } from "./fixtures/viewports";

const db = new PrismaClient();
const TMDB_ID = 1396; // Breaking Bad, déjà seedé (voir e2e/season-watch-cascade.spec.ts)
const BASE_URL = "http://localhost:3100";

test.describe("Watchlist - régression visuelle", () => {
  let profileId: string;

  test.beforeAll(async () => {
    const media = await db.media.findFirst({ where: { tmdbId: TMDB_ID, type: "TV" } });
    if (!media) {
      throw new Error("Fixture manquante : média Breaking Bad introuvable en base");
    }
    const profile = await createVisualProfile(db, "Watchlist");
    profileId = profile.id;
    await db.watchlistItem.create({
      data: { mediaId: media.id, profileId, status: "WATCHING" },
    });
  });

  test.afterAll(async () => {
    await deleteVisualProfile(db, profileId);
    await db.$disconnect();
  });

  test.beforeEach(async ({ context, page }) => {
    await loginAs(context, profileId, BASE_URL);
    await mockTmdbImages(page);
  });

  for (const { name, size } of VIEWPORTS) {
    test(`pleine page @ ${name}`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto("/watchlist");
      await expect(page.locator(".group").first()).toBeVisible();
      await expect(page).toHaveScreenshot(`watchlist-${name}.png`, { fullPage: true });
    });
  }

  test("hover première carte @ tablet", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS[1].size);
    await page.goto("/watchlist");
    await page.locator(".group").first().hover();
    await expect(page).toHaveScreenshot("watchlist-hover-tablet.png", { fullPage: true });
  });

  test("hover première carte @ desktop", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS[2].size);
    await page.goto("/watchlist");
    await page.locator(".group").first().hover();
    await expect(page).toHaveScreenshot("watchlist-hover-desktop.png", { fullPage: true });
  });

  test("focus première carte", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS[2].size);
    await page.goto("/watchlist");
    await page.locator('a[href^="/media/"]').first().focus();
    await expect(page).toHaveScreenshot("watchlist-focus-desktop.png", { fullPage: true });
  });
});
```

- [ ] **Step 11: Générer les baselines**

Run: `npm run test:visual:update`
Expected: exit code 0, 7 tests passés (3 pleine-page + 2 hover + 1 focus... vérifier le compte exact affiché), fichiers PNG créés sous `tests/visual/__screenshots__/watchlist.visual.spec.ts-snapshots/`.

- [ ] **Step 12: Vérifier la stabilité (run sans update)**

Run: `npm run test:visual`
Expected: exit code 0, 0 diff (les baselines tout juste générées matchent exactement ce même run).

- [ ] **Step 13: Commit infrastructure + spec Watchlist**

```bash
git add src/lib/tmdb.ts package.json playwright.visual.config.ts tests/visual
git commit -m "test: infra régression visuelle Playwright + surface Watchlist"
```

---

## Task 2 : Surface Détail

**Files:**
- Create: `tests/visual/detail.visual.spec.ts`
- Create (générés) : `tests/visual/__screenshots__/detail.visual.spec.ts-snapshots/*.png`

**Interfaces:**
- Consumes: `VIEWPORTS`, `loginAs`, `createVisualProfile`, `deleteVisualProfile`, `mockTmdbImages` (Task 1)

- [ ] **Step 1: Écrire le spec Détail**

`tests/visual/detail.visual.spec.ts` :

```ts
import "dotenv/config";
import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { loginAs } from "./fixtures/auth";
import { mockTmdbImages } from "./fixtures/mock-tmdb-images";
import { createVisualProfile, deleteVisualProfile } from "./fixtures/profile";
import { VIEWPORTS } from "./fixtures/viewports";

const db = new PrismaClient();
const TMDB_ID = 1396;
const BASE_URL = "http://localhost:3100";

test.describe("Détail média - régression visuelle", () => {
  let profileId: string;

  test.beforeAll(async () => {
    const media = await db.media.findFirst({ where: { tmdbId: TMDB_ID, type: "TV" } });
    if (!media) {
      throw new Error("Fixture manquante : média Breaking Bad introuvable en base");
    }
    const profile = await createVisualProfile(db, "Detail");
    profileId = profile.id;
  });

  test.afterAll(async () => {
    await deleteVisualProfile(db, profileId);
    await db.$disconnect();
  });

  test.beforeEach(async ({ context, page }) => {
    await loginAs(context, profileId, BASE_URL);
    await mockTmdbImages(page);
  });

  for (const { name, size } of VIEWPORTS) {
    test(`pleine page @ ${name}`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto(`/media/tv/${TMDB_ID}`);
      await expect(page.getByRole("button", { name: /ma liste/ })).toBeVisible();
      await expect(page).toHaveScreenshot(`detail-${name}.png`, { fullPage: true });
    });
  }

  test("hover bouton action principal @ tablet", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS[1].size);
    await page.goto(`/media/tv/${TMDB_ID}`);
    await page.getByRole("button", { name: /ma liste/ }).hover();
    await expect(page).toHaveScreenshot("detail-hover-tablet.png", { fullPage: true });
  });

  test("hover bouton action principal @ desktop", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS[2].size);
    await page.goto(`/media/tv/${TMDB_ID}`);
    await page.getByRole("button", { name: /ma liste/ }).hover();
    await expect(page).toHaveScreenshot("detail-hover-desktop.png", { fullPage: true });
  });

  test("focus bouton action principal", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS[2].size);
    await page.goto(`/media/tv/${TMDB_ID}`);
    await page.getByRole("button", { name: /ma liste/ }).focus();
    await expect(page).toHaveScreenshot("detail-focus-desktop.png", { fullPage: true });
  });
});
```

*Note :* profil neuf sans `watchlistItem` ni `episodeWatch` → état déterministe garanti ("Ajouter à ma liste", saison 1 par défaut, 0 épisode vu), sans avoir à toucher aux données existantes du profil de dev.

- [ ] **Step 2: Générer les baselines**

Run: `npm run test:visual:update -- detail.visual.spec.ts`
Expected: exit code 0, PNG créés sous `tests/visual/__screenshots__/detail.visual.spec.ts-snapshots/`.

- [ ] **Step 3: Vérifier la stabilité**

Run: `npm run test:visual -- detail.visual.spec.ts`
Expected: exit code 0, 0 diff.

- [ ] **Step 4: Commit**

```bash
git add tests/visual/detail.visual.spec.ts tests/visual/__screenshots__
git commit -m "test: régression visuelle surface Détail"
```

---

## Task 3 : Surface Calendrier

**Files:**
- Create: `tests/visual/calendar.visual.spec.ts`
- Create (générés) : `tests/visual/__screenshots__/calendar.visual.spec.ts-snapshots/*.png`

**Interfaces:**
- Consumes: `VIEWPORTS`, `loginAs`, `createVisualProfile`, `deleteVisualProfile`, `mockTmdbImages` (Task 1)

**Contexte :** `/calendar` interroge **toutes** les `PlanEntry` de l'instance (non filtrées par profil) — le spec doit donc temporairement retirer les entrées existantes à venir puis les restaurer, pour garantir un contenu déterministe sans perte de données. Le badge de date affiche un texte constant pour "aujourd'hui" (`Aujourd'hui`) et "demain" (`Demain`), mais le jour de la semaine (`lundi`, `mardi`...) varie réellement selon la date du jour : on le masque via l'option `mask` de `toHaveScreenshot`.

- [ ] **Step 1: Écrire le spec Calendrier**

`tests/visual/calendar.visual.spec.ts` :

```ts
import "dotenv/config";
import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import type { PlanEntry } from "@prisma/client";
import { loginAs } from "./fixtures/auth";
import { mockTmdbImages } from "./fixtures/mock-tmdb-images";
import { createVisualProfile, deleteVisualProfile } from "./fixtures/profile";
import { VIEWPORTS } from "./fixtures/viewports";

const db = new PrismaClient();
const TMDB_ID = 1396;
const BASE_URL = "http://localhost:3100";
const WEEKDAY_REGEX = /^(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)$/;

test.describe("Calendrier - régression visuelle", () => {
  let profileId: string;
  let existingPlanEntries: PlanEntry[] = [];

  test.beforeAll(async () => {
    const media = await db.media.findFirst({ where: { tmdbId: TMDB_ID, type: "TV" } });
    if (!media) {
      throw new Error("Fixture manquante : média Breaking Bad introuvable en base");
    }
    const profile = await createVisualProfile(db, "Calendar");
    profileId = profile.id;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    existingPlanEntries = await db.planEntry.findMany({ where: { scheduledAt: { gte: startOfToday } } });
    await db.planEntry.deleteMany({ where: { id: { in: existingPlanEntries.map((e) => e.id) } } });

    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    await db.planEntry.createMany({
      data: [
        { mediaId: media.id, scheduledAt: today, createdByProfileId: profileId, notes: "Séance test visuel" },
        { mediaId: media.id, scheduledAt: tomorrow, createdByProfileId: profileId, notes: null },
      ],
    });
  });

  test.afterAll(async () => {
    await db.planEntry.deleteMany({ where: { createdByProfileId: profileId } });
    if (existingPlanEntries.length > 0) {
      await db.planEntry.createMany({
        data: existingPlanEntries.map((entry) => ({
          id: entry.id,
          mediaId: entry.mediaId,
          scheduledAt: entry.scheduledAt,
          createdByProfileId: entry.createdByProfileId,
          notes: entry.notes,
          createdAt: entry.createdAt,
        })),
      });
    }
    await deleteVisualProfile(db, profileId);
    await db.$disconnect();
  });

  test.beforeEach(async ({ context, page }) => {
    await loginAs(context, profileId, BASE_URL);
    await mockTmdbImages(page);
  });

  for (const { name, size } of VIEWPORTS) {
    test(`pleine page @ ${name}`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto("/calendar");
      await expect(page.getByText("Séance test visuel")).toBeVisible();
      await expect(page).toHaveScreenshot(`calendar-${name}.png`, {
        fullPage: true,
        mask: [page.locator("span", { hasText: WEEKDAY_REGEX })],
      });
    });
  }
});
```

- [ ] **Step 2: Générer les baselines**

Run: `npm run test:visual:update -- calendar.visual.spec.ts`
Expected: exit code 0, PNG créés sous `tests/visual/__screenshots__/calendar.visual.spec.ts-snapshots/`.

- [ ] **Step 3: Vérifier la stabilité**

Run: `npm run test:visual -- calendar.visual.spec.ts`
Expected: exit code 0, 0 diff.

- [ ] **Step 4: Vérifier la restauration des données**

Run : `npx prisma studio` (ou une requête directe) pour confirmer que les `PlanEntry` existantes avant le test (s'il y en avait) sont bien de retour avec le même `id`. Si la base de dev était vide de plans à venir avant le test, confirmer simplement qu'elle l'est de nouveau après (`SELECT count(*) FROM PlanEntry WHERE scheduledAt >= date('now')` via `sqlite3 dev.db` ou équivalent).

- [ ] **Step 5: Commit**

```bash
git add tests/visual/calendar.visual.spec.ts tests/visual/__screenshots__
git commit -m "test: régression visuelle surface Calendrier"
```

---

## Task 4 : Surface Profil

**Files:**
- Create: `tests/visual/profile.visual.spec.ts`
- Create (générés) : `tests/visual/__screenshots__/profile.visual.spec.ts-snapshots/*.png`

**Interfaces:**
- Consumes: `VIEWPORTS`, `loginAs`, `deleteVisualProfile`, `mockTmdbImages` (Task 1)

**Limite connue (documentée dans le spec) :** `/profiles` liste **tous** les profils de l'instance, non filtrés. La capture "pleine page" reflète donc les profils déjà présents en base locale de dev — régénérer les baselines après tout ajout/suppression de profil. Seuls les états hover/focus sont isolés sur un avatar contrôlé par le test.

- [ ] **Step 1: Écrire le spec Profil**

`tests/visual/profile.visual.spec.ts` :

```ts
import "dotenv/config";
import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { loginAs } from "./fixtures/auth";
import { mockTmdbImages } from "./fixtures/mock-tmdb-images";
import { deleteVisualProfile } from "./fixtures/profile";
import { VIEWPORTS } from "./fixtures/viewports";

const db = new PrismaClient();
const BASE_URL = "http://localhost:3100";

test.describe("Profil - régression visuelle", () => {
  let activeProfileId: string;
  let secondaryProfileId: string;
  let createdSecondary = false;

  test.beforeAll(async () => {
    const profiles = await db.profile.findMany({ orderBy: { createdAt: "asc" } });
    if (profiles.length === 0) {
      throw new Error("Fixture manquante : aucun profil en base");
    }
    activeProfileId = profiles[0].id;

    if (profiles[1]) {
      secondaryProfileId = profiles[1].id;
    } else {
      const created = await db.profile.create({
        data: { name: "Visual QA — Profile secondaire", avatarColor: "#7C5CBF" },
      });
      secondaryProfileId = created.id;
      createdSecondary = true;
    }
  });

  test.afterAll(async () => {
    if (createdSecondary) {
      await deleteVisualProfile(db, secondaryProfileId);
    }
    await db.$disconnect();
  });

  test.beforeEach(async ({ context, page }) => {
    await loginAs(context, activeProfileId, BASE_URL);
    await mockTmdbImages(page);
  });

  for (const { name, size } of VIEWPORTS) {
    test(`pleine page @ ${name}`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto("/profiles");
      await expect(page.getByRole("heading", { name: "Qui regarde ?" })).toBeVisible();
      await expect(page).toHaveScreenshot(`profile-${name}.png`, { fullPage: true });
    });
  }

  test("hover avatar secondaire @ tablet", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS[1].size);
    await page.goto("/profiles");
    await page.getByRole("button", { name: /Passer au profil/ }).first().hover();
    await expect(page).toHaveScreenshot("profile-hover-tablet.png", { fullPage: true });
  });

  test("hover avatar secondaire @ desktop", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS[2].size);
    await page.goto("/profiles");
    await page.getByRole("button", { name: /Passer au profil/ }).first().hover();
    await expect(page).toHaveScreenshot("profile-hover-desktop.png", { fullPage: true });
  });

  test("focus avatar secondaire", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS[2].size);
    await page.goto("/profiles");
    await page.getByRole("button", { name: /Passer au profil/ }).first().focus();
    await expect(page).toHaveScreenshot("profile-focus-desktop.png", { fullPage: true });
  });
});
```

- [ ] **Step 2: Générer les baselines**

Run: `npm run test:visual:update -- profile.visual.spec.ts`
Expected: exit code 0, PNG créés sous `tests/visual/__screenshots__/profile.visual.spec.ts-snapshots/`.

- [ ] **Step 3: Vérifier la stabilité**

Run: `npm run test:visual -- profile.visual.spec.ts`
Expected: exit code 0, 0 diff.

- [ ] **Step 4: Commit**

```bash
git add tests/visual/profile.visual.spec.ts tests/visual/__screenshots__
git commit -m "test: régression visuelle surface Profil"
```

---

## Task 5 : Surface Recherche

**Files:**
- Create: `tests/visual/search.visual.spec.ts`
- Create (générés) : `tests/visual/__screenshots__/search.visual.spec.ts-snapshots/*.png`

**Interfaces:**
- Consumes: `VIEWPORTS`, `loginAs`, `createVisualProfile`, `deleteVisualProfile` (Task 1). N'utilise pas `mockTmdbImages` : les résultats mockés (`mock-tmdb-server.ts`) ont `poster_path: null`, donc aucune image n'est demandée.

- [ ] **Step 1: Écrire le spec Recherche**

`tests/visual/search.visual.spec.ts` :

```ts
import "dotenv/config";
import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { loginAs } from "./fixtures/auth";
import { createVisualProfile, deleteVisualProfile } from "./fixtures/profile";
import { VIEWPORTS } from "./fixtures/viewports";

const db = new PrismaClient();
const BASE_URL = "http://localhost:3100";

test.describe("Recherche - régression visuelle", () => {
  let profileId: string;

  test.beforeAll(async () => {
    const profile = await createVisualProfile(db, "Search");
    profileId = profile.id;
  });

  test.afterAll(async () => {
    await deleteVisualProfile(db, profileId);
    await db.$disconnect();
  });

  test.beforeEach(async ({ context }) => {
    await loginAs(context, profileId, BASE_URL);
  });

  for (const { name, size } of VIEWPORTS) {
    test(`pleine page @ ${name}`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto("/search?q=matrix");
      await expect(page.getByText("2 résultats")).toBeVisible();
      await expect(page).toHaveScreenshot(`search-${name}.png`, { fullPage: true });
    });
  }

  test("hover première carte @ tablet", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS[1].size);
    await page.goto("/search?q=matrix");
    await page.locator(".group").first().hover();
    await expect(page).toHaveScreenshot("search-hover-tablet.png", { fullPage: true });
  });

  test("hover première carte @ desktop", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS[2].size);
    await page.goto("/search?q=matrix");
    await page.locator(".group").first().hover();
    await expect(page).toHaveScreenshot("search-hover-desktop.png", { fullPage: true });
  });

  test("focus première carte", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS[2].size);
    await page.goto("/search?q=matrix");
    await page.locator('a[href^="/media/"]').first().focus();
    await expect(page).toHaveScreenshot("search-focus-desktop.png", { fullPage: true });
  });
});
```

- [ ] **Step 2: Générer les baselines**

Run: `npm run test:visual:update -- search.visual.spec.ts`
Expected: exit code 0, PNG créés sous `tests/visual/__screenshots__/search.visual.spec.ts-snapshots/`.

- [ ] **Step 3: Vérifier la stabilité**

Run: `npm run test:visual -- search.visual.spec.ts`
Expected: exit code 0, 0 diff.

- [ ] **Step 4: Commit**

```bash
git add tests/visual/search.visual.spec.ts tests/visual/__screenshots__
git commit -m "test: régression visuelle surface Recherche"
```

---

## Task 6 : Commande `/verify-visual` + suite complète

**Files:**
- Create: `.claude/skills/verify-visual/SKILL.md`

**Interfaces:**
- Consumes: `npm run test:visual` / `npm run test:visual:update` (Task 1)

- [ ] **Step 1: Écrire le skill**

`.claude/skills/verify-visual/SKILL.md` :

```markdown
---
name: verify-visual
description: Recapture toutes les surfaces de régression visuelle (Watchlist, Détail, Calendrier, Profil, Recherche), compare aux baselines tests/visual/__screenshots__, et échoue bruyamment (>1% delta) avec les images côte-à-côte.
---

# /verify-visual

1. Lance : `npm run test:visual`
   - Sous le capot : `playwright test --config=playwright.visual.config.ts`.
   - Le harnais démarre son propre serveur Next.js dédié (port 3100) et un mock TMDb local — aucune interférence avec un `npm run dev` déjà lancé sur le port 3000, aucune dépendance réseau externe.
2. Si tout passe : rapporte "Régression visuelle : 0 delta, N surfaces vérifiées." (N = nombre de tests exécutés, visible dans la sortie Playwright).
3. Si une capture dépasse 1% de delta :
   - Playwright génère `<nom>-expected.png`, `<nom>-actual.png`, `<nom>-diff.png` sous `test-results/`.
   - Liste, pour chaque surface en échec : les 3 chemins d'image + le % exact de pixels différents (donné dans la sortie Playwright).
   - Termine en échec explicite — ne jamais masquer un delta ni l'accepter silencieusement.
   - Indique la commande de consultation : `npx playwright show-report` (rapport HTML, vue côte-à-côte intégrée).
4. Mise à jour intentionnelle des baselines (uniquement si le changement visuel est voulu, jamais automatique) :
   `npm run test:visual:update`
```

- [ ] **Step 2: Lancer la suite complète**

Run: `npm run test:visual`
Expected: exit code 0, tous les specs (watchlist/detail/calendar/profile/search) passent, 0 diff.

- [ ] **Step 3: Vérifier la détection de régression**

Modifier temporairement `src/app/globals.css` (changer la valeur de la variable de couleur d'accent, ex. `#E8A33D` → `#00FF00`), puis :

Run: `npm run test:visual`
Expected: échec explicite (exit code non nul), au moins une capture par surface dépasse 1% de delta, fichiers `*-diff.png` générés sous `test-results/`.

Annuler le changement :

```bash
git checkout -- src/app/globals.css
```

Run: `npm run test:visual`
Expected: exit code 0, retour à 0 diff (confirme que le harnais suit bien le style réel du projet, pas une valeur figée).

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/verify-visual
git commit -m "docs: commande /verify-visual pour la régression visuelle"
```
