# Architecture : MonProjo

## 1. Vue d'ensemble

Application Next.js (App Router) monolithique, server-first : la logique métier vit dans des Server Actions et des Route Handlers, l'UI dans des Server/Client Components. Persistance via Prisma + SQLite (fichier unique, adapté à un déploiement mono-foyer/self-hosted). Déploiement cible : conteneur Docker unique avec volume persistant pour le fichier SQLite.

```
Navigateur ──> Next.js App Router (RSC + Server Actions)
                  ├── src/app/**            pages (routes)
                  ├── src/components/**     UI (shadcn/ui + composants maison)
                  ├── src/lib/actions/**     "use server" — mutations Prisma
                  ├── src/lib/session.ts     profil actif (cookie httpOnly)
                  ├── src/lib/tmdb.ts        client TMDb (source de vérité métadonnées)
                  ├── src/lib/omdb.ts        fallback note IMDb
                  └── src/lib/db.ts          singleton PrismaClient
                          │
                          ▼
                  SQLite (fichier, volume Docker) via Prisma
```

## 2. Stack

- **Framework** : Next.js 16 (App Router, React 19, Server Components + Server Actions)
- **UI** : shadcn/ui (Radix via `@base-ui/react`), Tailwind CSS v4, `class-variance-authority`, `lucide-react`
- **ORM/DB** : Prisma 6 → SQLite (`DATABASE_URL=file:...`), client généré dans `src/generated/prisma`
- **Sources de données externes** : TMDb (recherche + métadonnées, `fr-FR`), OMDb (fallback note IMDb quand TMDb ne fournit rien d'exploitable)
- **Infra** : Docker multi-stage (build → runner Alpine), `docker-compose.yml` avec volume `monprojo-data`, `docker-entrypoint.sh` (migrations au démarrage)
- **Tests E2E** : MCP Playwright (cf. CLAUDE.md) — pas encore de suite écrite dans le repo à ce jour
- **Process** : OpenSpec (specs sous `openspec/changes/*`) + Superpowers (debugging systématique, verification-before-completion)

## 3. Modèle de données (Prisma)

```
Profile 1───* WatchlistItem *───1 Media
Profile 1───* PlanEntry     *───1 Media
```

- **Profile** : `name`, `avatarColor` — un profil = un utilisateur du foyer, isole watchlist/planning.
- **Media** : cache local des métadonnées TMDb/OMDb (`tmdbId` unique, `imdbId`, `type: MOVIE|TV`, titre, poster, overview, notes). Rafraîchi si `cachedAt` a plus de 24h (`CACHE_TTL_MS` dans `lib/actions/media.ts`).
- **WatchlistItem** : lien `(mediaId, profileId)` unique, `status: TO_WATCH|WATCHING|WATCHED`.
- **PlanEntry** : entrée de calendrier (date planifiée, notes, créée par un profil) — pas de lien direct à un profil "propriétaire unique", visible par tous (calendrier partagé, cf. description app dans layout.tsx).

Pas encore modélisé : progression épisode par épisode (saison/épisode) — voir `openspec/changes/episode-tracking-by-season` (proposé, non implémenté). Le `WatchStatus` d'une série est aujourd'hui saisi manuellement, pas dérivé des épisodes vus.

## 4. Sessions & profils

Pas d'authentification — le "profil actif" est stocké dans un cookie httpOnly (`monprojo_profile_id`, 1 an, `lib/session.ts`). `getActiveProfile()` lit le cookie et résout le `Profile` en base ; les Server Actions qui touchent la watchlist/le planning appellent systématiquement cette fonction et lèvent si aucun profil actif. Changer de profil = changer la valeur du cookie (`setActiveProfileCookie`), pas de vrai login/mot de passe.

## 5. Flux de données externes (TMDb/OMDb)

- `lib/tmdb.ts` : recherche (`searchMedia`) et détail (`getMediaDetail`) via `https://api.themoviedb.org/3`, clé dans `TMDB_API_KEY`, langue forcée `fr-FR`.
- `lib/omdb.ts` : `getImdbRating(imdbId)` — fallback uniquement, best-effort (erreurs avalées silencieusement côté appelant, `lib/actions/media.ts`).
- `lib/actions/media.ts::getOrRefreshMedia(tmdbId, type)` : point d'entrée unique pour obtenir un `Media` local à jour — upsert avec cache 24h. Toutes les features qui ont besoin d'un `mediaId` (watchlist, planning) doivent passer par cette fonction en amont si elles ne partent que d'un `tmdbId` TMDb (cf. `search-hover-quick-add`, `search-autocomplete-watchlist`).

## 6. Routes (App Router)

| Route | Fichier | État |
|---|---|---|
| `/` | `src/app/page.tsx` | Accueil (squelette, 7 lignes) |
| `/search` | `src/app/search/page.tsx` | Recherche TMDb (formulaire, pas d'autocomplete) |
| `/watchlist` | `src/app/watchlist/page.tsx` | Liste + filtrage par statut |
| `/calendar` | `src/app/calendar/page.tsx` | Planning (PlanEntry) |
| `/media/[type]/[tmdbId]` | `src/app/media/[type]/[tmdbId]/page.tsx` | Fiche détail, ajout watchlist/planning |
| `/profiles` | `src/app/profiles/page.tsx` | Création/sélection de profil |
| `/decide` | — | **Référencé dans `nav-items.tsx` mais route absente** — US-6.x du PRD non implémentées |

## 7. UI / Design system

- Composants shadcn dans `src/components/ui/*` (avatar, badge, button, card, dialog, input, select, tabs, textarea).
- Layout responsive : `src/components/layout/sidebar.tsx` (desktop), `mobile-top-bar.tsx` + `mobile-bottom-nav.tsx` (mobile), navigation pilotée par la liste unique `nav-items.tsx`. `src/components/nav.tsx` orchestre le choix desktop/mobile.
- Export de maquette source (Claude Design) dans `src/design/` (`MonProjo.dc.html` + `support.js`, format propriétaire `x-dc`/`sc-if`/`sc-for`) — **à ne pas traiter comme code applicatif** : c'est la référence visuelle en cours de portage vers de vrais composants React/Tailwind (cf. `openspec/changes/integrate-design-export`). Une fois le portage fini, ce dossier doit être supprimé du repo.
- Charte graphique et tokens couleur : voir `CLAUDE.md` (dark mode imposé, `#0A0B0D`, accents par profil).

## 8. Écart Spec ↔ Code (à date du 2026-07-06)

Travaux proposés dans `openspec/changes/*` mais pas encore implémentés dans `src/` :

- **episode-tracking-by-season** — détail épisodes par saison, mass-watch saison, statut dérivé.
- **integrate-design-export** — portage réel de la maquette `src/design/*` vers les composants React.
- **search-autocomplete-watchlist** — autocomplete recherche (3+ caractères) + ajout rapide watchlist.
- **search-hover-quick-add** — boutons hover sur `MediaCard` dans `/search` (watchlist + planifier).
- **watchlist-toggle-feedback** — bouton "Retirer de la watchlist" + toasts de confirmation.

Ces items correspondent aux demandes listées dans `TASKS.md`. La feature "Décider" (US-6.x du PRD) n'a ni route ni change OpenSpec associée pour l'instant.

## 9. Déploiement

`Dockerfile` multi-stage : build (`npm ci` + `prisma generate` + `next build`) puis image runner Alpine minimale, utilisateur non-root (`nextjs`), volume `/app/data` pour le fichier SQLite. `docker-entrypoint.sh` exécute les migrations Prisma avant de démarrer. `docker-compose.yml` fournit un service unique exposant le port 3000 et injecte `TMDB_API_KEY`/`OMDB_API_KEY` depuis l'environnement hôte.

Dev local sans Node installé : `docker-compose.dev.yml` (image Node nue, bind-mount du repo, `next dev` avec polling). CI/CD : `.github/workflows/docker-publish.yml` build et publie l'image sur GHCR (`ghcr.io/gudupont/monprojo`, package privé) à chaque push sur `main`. Déploiement NAS Synology (Container Manager tire l'image depuis GHCR, ou méthode Projet/import manuel en secours) : voir `DEPLOYMENT.md`.
