## Why

Aujourd'hui, le bouton "Ajouter à ma watchlist" sur la page détail d'un média (`src/app/media/[type]/[tmdbId]/page.tsx`) reste identique une fois l'item ajouté : rien n'indique à l'utilisateur que l'ajout a réussi, et rien n'empêche de cliquer plusieurs fois (l'action `addToWatchlist` fait un `upsert` silencieux, donc ce n'est pas destructeur, mais l'UX est trompeuse). L'utilisateur ne sait pas si l'item est déjà dans sa watchlist et ne peut pas le retirer depuis cette page.

## What Changes

- La page détail média détecte si le média est déjà dans la watchlist du profil actif.
- Si absent : bouton "Ajouter à ma watchlist" (comportement actuel, `addToWatchlist`).
- Si présent : bouton change d'état pour "Retirer de la watchlist", qui appelle `removeFromWatchlist`.
- Après une action d'ajout réussie, un message de confirmation (toast) s'affiche ("Ajouté à la watchlist").
- Après un retrait, un message de confirmation s'affiche également ("Retiré de la watchlist").
- Ajout d'un mécanisme de toast/notification léger réutilisable (pas de dépendance externe lourde, composant React + CSS interne au design system existant).

## Capabilities

### New Capabilities
- `watchlist-toggle`: Détection de présence dans la watchlist et bascule Ajouter/Retirer depuis la page détail média, avec feedback visuel (toast) sur chaque action.

### Modified Capabilities
(aucune spec existante à modifier — première spec formalisée pour la watchlist)

## Impact

- `src/app/media/[type]/[tmdbId]/page.tsx` : passer d'un bouton statique à un composant client stateful (ou sous-composant) qui connaît l'état watchlist du média pour le profil actif.
- `src/lib/actions/watchlist.ts` : `removeFromWatchlist` prend actuellement un `itemId` (id du `WatchlistItem`), il faut soit une variante par `mediaId`, soit résoudre l'id côté page.
- Nouveau composant de toast partagé (ex. `src/components/ui/toast.tsx` + provider) pour afficher les messages de confirmation, réutilisable ailleurs dans l'app.
- Aucun changement de schéma Prisma nécessaire (le modèle `WatchlistItem` existant suffit).
