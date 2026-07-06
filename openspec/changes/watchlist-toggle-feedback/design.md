## Context

`src/app/media/[type]/[tmdbId]/page.tsx` est un Server Component qui affiche un unique bouton "Ajouter à ma watchlist" lié à la server action `addToWatchlist(mediaId)` (`src/lib/actions/watchlist.ts`). Le modèle `WatchlistItem` a une contrainte unique `[mediaId, profileId]`, donc l'ajout est déjà idempotent côté données (`upsert`), mais l'UI ne reflète jamais l'état réel. Le profil actif est résolu via cookie (`getActiveProfile`, `src/lib/session.ts`). Il n'existe aujourd'hui aucun système de toast/notification dans le projet (`src/components/ui/` ne contient que des primitives `base-ui` + `cva`, pas de dépendance `sonner`/`radix-toast`).

## Goals / Non-Goals

**Goals:**
- La page détail média sait, au rendu, si le média est déjà dans la watchlist du profil actif.
- Le bouton bascule visuellement et fonctionnellement entre "Ajouter à ma watchlist" et "Retirer de la watchlist".
- Chaque action (ajout ou retrait) déclenche un message de confirmation visible temporairement.
- Le composant de toast est générique et réutilisable pour de futurs messages de confirmation dans l'app.

**Non-Goals:**
- Pas de refonte de la page watchlist (`src/app/watchlist/page.tsx`) ni de son propre bouton de suppression existant.
- Pas de système de notification persistant/historisé (uniquement feedback éphémère de session).
- Pas d'ajout de dépendance externe pour les toasts (ex. `sonner`) — implémentation interne légère, cohérente avec la contrainte CLAUDE.md d'éviter les libs UI lourdes quand un composant React + CSS suffit.

## Decisions

1. **Détection de présence** : dans `MediaDetailPage` (Server Component), requêter `db.watchlistItem.findUnique({ where: { mediaId_profileId: { mediaId, profileId } } })` en parallèle des autres `Promise.all` existants, pour récupérer l'item (ou `null`) et son `id`.
   - Alternative écartée : faire la détection côté client via un fetch — inutile, l'info est disponible au moment du rendu serveur et évite un flash "Ajouter" → "Retirer".

2. **Bouton toggle** : extraire un nouveau composant client `src/components/watchlist-toggle-button.tsx` recevant `mediaId`, `initialItemId: string | null` en props. Il gère localement l'état (`itemId` en `useState`), affiche le bon libellé/variant, et appelle la server action correspondante dans un `useTransition` pour l'état de chargement.
   - Alternative écartée : garder un `<form action={...}>` server-only comme aujourd'hui — impossible d'afficher un toast client ni de basculer l'état sans rechargement complet de la page.

3. **Retrait par mediaId** : `removeFromWatchlist` actuel prend un `itemId`. On ajoute une action `removeFromWatchlistByMedia(mediaId: string)` dans `src/lib/actions/watchlist.ts` qui résout le profil actif et supprime via la même clé composite `mediaId_profileId`, pour ne pas exiger que le composant connaisse l'`id` interne du `WatchlistItem`. `addToWatchlist` est modifié pour retourner l'`id` du `WatchlistItem` créé/existant (utile pour mettre à jour l'état client après ajout, même si non strictement nécessaire pour le toggle affiché).
   - Alternative écartée : passer `initialItemId` puis le réutiliser pour le retrait — fonctionne aussi, mais dupliquer la clé `mediaId_profileId` évite un état incohérent si l'`id` initial était `null` puis un ajout a lieu dans le même cycle de vie du composant (on retire alors par `mediaId`, plus simple et source de vérité unique).

4. **Toast** : composant `src/components/ui/toast.tsx` + provider `ToastProvider` (Context React) monté une fois dans le layout racine (`src/app/layout.tsx`). Expose un hook `useToast()` avec `toast.success(message)` / `toast.error(message)`. Rendu en `fixed` bottom-right, auto-dismiss après ~3s, style cohérent avec le thème sombre du projet (`#15171B`, bordure `#262A31`, accent `#E8A33D`).
   - Alternative écartée : dépendance `sonner` — rejetée par la règle projet "ne pas utiliser de librairies UI externes lourdes si le design cible peut être atteint avec des composants React standards".

5. **Déclenchement du toast** : le composant `watchlist-toggle-button.tsx` appelle `useToast()` après résolution de la server action (succès → message ; erreur → message d'erreur), plutôt que de faire remonter l'info via `revalidatePath` seul, qui ne permet pas de feedback transitoire ciblé.

## Risks / Trade-offs

- [Risk] Deux onglets ouverts sur la même page détail peuvent désynchroniser l'état visuel (un onglet ignore l'ajout fait dans l'autre) → Mitigation : la source de vérité reste la base ; au pire l'utilisateur reclique et l'action reste idempotente (upsert / delete conditionnel sur profil).
- [Risk] `removeFromWatchlist(itemId)` existant est utilisé ailleurs (page watchlist) — ajouter `removeFromWatchlistByMedia` en parallèle ne casse rien, mais crée une légère duplication de logique de suppression → Mitigation : factoriser la logique de suppression interne dans une fonction privée partagée par les deux actions exportées.
- [Risk] Toast maison mal accessible (pas de `aria-live`) → Mitigation : conteneur toast avec `role="status"` / `aria-live="polite"`.

## Open Questions

Aucune — périmètre suffisamment cadré pour passer directement aux specs et tasks.
