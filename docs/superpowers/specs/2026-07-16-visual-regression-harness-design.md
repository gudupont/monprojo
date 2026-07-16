# Harnais de régression visuelle — Design

Date : 2026-07-16
Statut : Approuvé

## Contexte

MonProjo n'a pas de couverture de régression visuelle. Le CLAUDE.md distingue déjà deux canaux de test :
- MCP Playwright interactif (`mcp__plugin_playwright_playwright__*`) : vérification manuelle exploratoire, doit passer par le vrai formulaire `/login`.
- CLI `@playwright/test` (`e2e/*.spec.ts`) : suite de non-régression versionnée, peut injecter un cookie de session directement (pattern déjà utilisé dans `e2e/season-watch-cascade.spec.ts`).

Le harnais de régression visuelle (baselines, diff pixel, seuil, rapport côte-à-côte) est de la même nature que ces tests de non-régression : il utilise donc le canal CLI `@playwright/test` et sa fonctionnalité native `toHaveScreenshot()`, pas les outils MCP interactifs (qui n'ont pas de diff pixel intégré). Décision validée avec l'utilisateur.

## Objectif

Capturer des captures de référence (baselines) pour 5 surfaces clés (Watchlist, Détail, Calendrier, Profil, Recherche) à 3 largeurs (mobile 375px, tablette 768px, desktop 1280px), incluant les états hover/focus des cartes et boutons, puis fournir une commande `/verify-visual` qui recapture, compare pixel-à-pixel aux baselines, et échoue bruyamment (>1% de delta) avec les images côte-à-côte.

## Architecture

### Config Playwright dédiée

Nouveau fichier `playwright.visual.config.ts` à la racine, séparé de `playwright.config.ts` (qui reste dédié à `./e2e` et n'est pas modifié) :
- `testDir: "./tests/visual"`
- `snapshotDir: "./tests/visual/__screenshots__"` — baselines committées en git
- Port dédié : `webServer` (`npx next dev -p 3100`, `reuseExistingServer: false`) et `baseURL: "http://localhost:3100"` — port distinct du serveur dev habituel (3000) pour ne pas interférer avec une session de dev en cours, et démarré/arrêté par Playwright à chaque run
- `expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: "disabled" } }`
- `fullyParallel: false`, `workers: 1` (comme le config e2e existant, pour éviter les conflits sur la DB partagée)

### Arborescence

```
tests/visual/
  fixtures/
    auth.ts                    # loginAs(context, profileId) — cookie JWT injecté
    viewports.ts               # MOBILE/TABLET/DESKTOP {width,height}
    mock-tmdb-server.ts        # serveur HTTP local (payload de recherche figé) démarré via globalSetup
  global-setup.ts              # démarre le mock TMDb avant la suite
  watchlist.visual.spec.ts
  detail.visual.spec.ts
  calendar.visual.spec.ts
  profile.visual.spec.ts
  search.visual.spec.ts
  __screenshots__/            # baselines PNG, committées
```

## Matrice surfaces × viewports × états

| Surface | Route | Fixture requise | États capturés |
|---|---|---|---|
| Watchlist | `/watchlist` | profil existant + `watchlistItem` seedé (média Breaking Bad tmdbId 1396, déjà utilisé dans e2e) | full-page @375/768/1280 ; hover 1ère carte @768+1280 ; focus (Tab) 1ère carte |
| Détail | `/media/tv/1396` | media seedé, session+profil | full-page @375/768/1280 ; hover bouton d'action principal @768+1280 ; focus bouton |
| Calendrier | `/calendar` | `planEntry` seedées à des offsets relatifs à "aujourd'hui" (+0j, +3j), recalculés à chaque exécution | full-page @375/768/1280, avec `mask` Playwright sur les libellés de date (seule zone légitimement variable jour après jour) |
| Profil | `/profiles` | profil actif + un profil inactif | full-page @375/768/1280 ; hover avatar inactif ; focus (Tab) avatar |
| Recherche | `/search?q=matrix` | mock réseau : la recherche TMDb s'exécute côté serveur (Server Component/action), pas dans le navigateur, donc `page.route()` ne peut pas l'intercepter ; à la place, un serveur HTTP local (`tests/visual/fixtures/mock-tmdb-server.ts`) sert un payload de recherche figé, et `TMDB_BASE_URL` (env du `webServer` Playwright) redirige les appels serveur vers ce mock | full-page @375/768/1280 ; hover 1ère carte @768+1280 ; focus 1ère carte |

Viewports : mobile 375×812, tablette 768×1024, desktop 1280×800.

Hover uniquement capturé @768 et @1280 : les actions de carte (`hoverActions` dans `src/components/media-card.tsx`) sont révélées via `md:group-hover:opacity-100`, donc invisibles/non pertinentes en dessous du breakpoint `md` où elles sont déjà visibles en permanence (`flex-col`).

## Auth & données

- `tests/visual/fixtures/auth.ts` exporte `loginAs(context, profileId)` : signe un JWT HS256 avec `SESSION_SECRET`, injecte les cookies `monprojo_session` + `monprojo_profile_id` via `context.addCookies`. Repris tel quel du pattern `e2e/season-watch-cascade.spec.ts`. Ce canal CLI n'est pas soumis à la règle "vrai formulaire `/login`" du CLAUDE.md, qui cible la vérification manuelle MCP.
- Chaque spec gère son propre `beforeAll`/`afterAll` Prisma (`PrismaClient` direct, comme l'existant) pour garantir un état DB connu, et nettoie après exécution.
- Calendrier : les dates de `planEntry` sont calculées `new Date() + Nj` au moment de l'exécution du test — jamais de date en dur — pour garder une structure stable (nombre de cartes, regroupement par jour). Seul le texte affiché de la date change d'un jour à l'autre ; c'est la zone couverte par `mask`.
- Recherche : le mock serveur (`mock-tmdb-server.ts` + `TMDB_BASE_URL`) élimine la dépendance à `TMDB_API_KEY` et à la disponibilité réseau en CI ; démarré une fois via `globalSetup` pour toute la suite.

## `/verify-visual`

Nouveau `.claude/skills/verify-visual/SKILL.md` :
1. Lance `playwright.visual.config.ts`, qui démarre lui-même `next dev -p 3100` (port dédié, `reuseExistingServer: false`) et le mock TMDb (`global-setup.ts`) — pas de dépendance à un `npm run dev` déjà lancé sur le port 3000.
2. Lance `npx playwright test --config=playwright.visual.config.ts`.
3. Pas de baseline existante pour un screenshot → Playwright échoue explicitement (jamais d'acceptation silencieuse ; pas de `--update-snapshots` implicite).
4. Sur échec, Playwright génère nativement à côté de chaque baseline : `*-expected.png`, `*-actual.png`, `*-diff.png`, plus un rapport HTML consultable via `npx playwright show-report` (vue côte-à-côte intégrée).
5. Le skill résume en sortie, par surface en échec : chemins des 3 images + % de pixels différents. Échec bruyant : exit code non-zéro propagé, jamais un warning silencieux.
6. Mise à jour intentionnelle des baselines : commande séparée documentée dans le skill, `npx playwright test --config=playwright.visual.config.ts --update-snapshots` — jamais lancée automatiquement par `/verify-visual`.

## Hors périmètre

- Pas de script de diff maison (pixelmatch, etc.) : `toHaveScreenshot()` fournit nativement baseline/diff/seuil/rapport.
- Pas de modification de `playwright.config.ts` ni des specs `e2e/*.spec.ts` existants.
- Pas de couverture d'autres surfaces (login, décide, stats) — hors périmètre demandé.

## Vérification

- `npx playwright test --config=playwright.visual.config.ts --update-snapshots` une première fois pour générer les baselines, revue manuelle des PNG générés avant commit.
- Re-run sans `--update-snapshots` : doit passer à vert (0 diff) juste après génération.
- Modifier volontairement un style (ex. couleur d'accent) pour vérifier que le harnais détecte bien la régression et produit les 3 images + échoue bruyamment.
