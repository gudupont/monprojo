## Context

`/search` liste des résultats TMDB bruts (`tmdbId`, `type`, `title`, `poster`, ...) sans `Media.id` local. Les actions existantes (`addToWatchlist(mediaId)`, `createPlanEntry(formData)` avec `mediaId`) supposent qu'un `Media` local existe déjà, ce qui n'est vrai qu'après visite de la fiche détail (`getOrRefreshMedia`). `MediaCard` a déjà un slot `footer` utilisé par watchlist/calendrier pour afficher le statut ; il faut un second slot pour l'overlay hover sans casser ces usages.

## Goals / Non-Goals

**Goals:**
- Ajouter à la watchlist ou planifier un média directement depuis `/search`, en un clic pour la watchlist et via le dialogue existant pour la planification.
- Réutiliser `getOrRefreshMedia` pour ne pas dupliquer la logique de résolution/cache TMDB+OMDB.
- Ne pas casser les usages actuels de `MediaCard` (watchlist page, calendar-adjacent, media detail).

**Non-Goals:**
- Pas de retrait/toggle rapide depuis la recherche (retrait reste sur `/watchlist`).
- Pas de changement du modèle de données (`Media`, `WatchlistItem`, `PlanEntry` inchangés).
- Pas de support tactile spécifique (hover) au-delà du comportement standard CSS `:hover` / focus clavier pour l'accessibilité.

## Decisions

- **Overlay via nouvelle prop `hoverActions?: React.ReactNode` sur `MediaCard`**, distincte de `footer`, affichée en `absolute` sur l'image au survol (`group-hover`/`focus-within`) plutôt que de dupliquer `MediaCard` en variante recherche. Alternative rejetée : dupliquer un `SearchMediaCard` — plus de duplication de markup pour peu de gain.
- **Nouvelle server action `quickAddToWatchlist(tmdbId, type)`** dans `watchlist.ts`, qui appelle `getOrRefreshMedia` puis `addToWatchlist(media.id)`. Alternative rejetée : résoudre le `Media` côté page de recherche (`searchMedia` → boucle `getOrRefreshMedia` pour chaque résultat) — trop coûteux (N appels TMDB/OMDB à chaque chargement de page) alors qu'on ne veut résoudre qu'à l'action.
- **`PlanDialog` accepte soit `mediaId` direct (fiche détail), soit `{ tmdbId, type }` à résoudre** : ajout d'une action `resolveAndCreatePlanEntry(formData)` qui fait `getOrRefreshMedia(tmdbId, type)` puis `createPlanEntry`-équivalent, appelée quand `mediaId` n'est pas encore connu. Le composant reste unique, pas de duplication de dialogue.
- **Feedback bouton watchlist** : état local `pending`/`added` via `useTransition` + `useState` côté client (petit wrapper client `QuickAddButtons` autour des deux server actions), pas de dépendance toast supplémentaire — cohérent avec l'absence de librairie UI lourde imposée par CLAUDE.md.
- **Accessibilité** : les actions doivent aussi apparaître au `focus` clavier (pas seulement `:hover`), pour rester utilisables sans souris.

## Risks / Trade-offs

- [Résolution TMDB/OMDB à chaque clic "watchlist rapide" ajoute une latence perceptible (vs déjà en cache si visité récemment)] → `getOrRefreshMedia` a déjà un cache 24h (`CACHE_TTL_MS`), donc coût uniquement au premier ajout ou après expiration ; acceptable pour une action volontaire de l'utilisateur.
- [Ajout d'une prop supplémentaire sur `MediaCard` augmente légèrement sa surface d'API] → Prop optionnelle, défaut `undefined`, aucun impact sur les call sites existants.
- [Double clic rapide sur "Ajouter à la watchlist" pourrait déclencher deux appels concurrents] → `addToWatchlist` fait déjà un `upsert` idempotent ; le bouton passe en état `pending`/disabled pendant la transition côté client pour éviter le double submit.

## Open Questions

- Faut-il un état "déjà dans la watchlist" visible sur les résultats de recherche (nécessiterait de charger l'état watchlist du profil actif pour tous les résultats) ? Hors scope pour cette itération — le bouton reste actionnable même si déjà ajouté (upsert sans effet).
