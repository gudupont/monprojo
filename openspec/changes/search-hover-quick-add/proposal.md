## Why

Sur la page de recherche, ajouter un film/série à la watchlist ou le planifier nécessite d'ouvrir la fiche détail (`/media/[type]/[tmdbId]`), ce qui rallonge le parcours pour une action simple et fréquente. Des boutons d'action rapide au hover sur les résultats de recherche réduisent ce parcours à un seul clic.

## What Changes

- Ajout de boutons "Ajouter à la watchlist" et "Planifier" affichés au survol (hover) de chaque `MediaCard` dans les résultats de `/search`.
- Les résultats de recherche viennent de TMDB et n'ont pas encore de `Media` local (pas de `mediaId`) : les actions rapides doivent d'abord résoudre/créer l'enregistrement `Media` (réutilise `getOrRefreshMedia`) avant d'ajouter à la watchlist ou de créer une entrée de calendrier.
- Le bouton "Ajouter à la watchlist" déclenche une server action directement (pas de dialogue), avec feedback visuel (état "ajouté" / toast).
- Le bouton "Planifier" ouvre le même dialogue de planification (`PlanDialog`) que sur la fiche détail, mais capable de démarrer depuis un `tmdbId`/`type` plutôt qu'un `mediaId` déjà connu.
- `MediaCard` gagne une prop optionnelle pour afficher ces actions overlay (uniquement utilisée depuis `/search`, pas depuis la watchlist ou le calendrier où `footer` est déjà utilisé).

## Capabilities

### New Capabilities
- `search-quick-add`: actions rapides (watchlist, planification) accessibles au hover directement depuis les résultats de recherche, sans passer par la fiche détail.

### Modified Capabilities
(aucune capacité existante avec spec formelle - `MediaCard`, watchlist et planification n'ont pas de specs préexistantes dans `openspec/specs/`)

## Impact

- `src/components/media-card.tsx` : ajout d'une prop pour overlay d'actions au hover.
- `src/app/search/page.tsx` : passage des actions rapides à chaque `MediaCard`.
- `src/lib/actions/watchlist.ts` : nouvelle action capable de partir d'un `tmdbId`/`type` (résolution via `getOrRefreshMedia`).
- `src/lib/actions/calendar.ts` et/ou `src/components/plan-dialog.tsx` : variante acceptant `tmdbId`/`type` en plus de `mediaId`.
- Aucun changement de schéma Prisma (réutilise `Media`, `WatchlistItem`, `PlanEntry` existants).
