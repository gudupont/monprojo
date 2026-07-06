## Context

La recherche (`src/app/search/page.tsx`) est un Server Component avec formulaire GET classique : soumission → reload → `searchMedia` (TMDb `/search/multi`) → grille de `MediaCard`. L'ajout à la watchlist se fait aujourd'hui depuis la fiche détail média (`src/app/media/[type]/[tmdbId]`), via la server action `addToWatchlist(mediaId)` où `mediaId` est l'id **DB** (table `Media`), pas le `tmdbId`. La résolution TMDb → DB passe par `getOrRefreshMedia(tmdbId, type)` qui upsert la table `Media` (cache 24h) avant tout ajout watchlist.

L'app n'a pas encore de route API (`src/app/api/`) : ce sera la première. Le multi-profil existe (`getActiveProfile()` via `src/lib/session.ts`), la watchlist est déjà scoping par `profileId`.

## Goals / Non-Goals

**Goals:**
- Afficher des suggestions dès 3 caractères saisis, sans validation du formulaire.
- Permettre d'ajouter un résultat à la watchlist en un clic depuis la liste de suggestions, sans navigation.
- Réutiliser la logique existante (`searchMedia`, `getOrRefreshMedia`, `addToWatchlist`) plutôt que dupliquer.
- Donner un retour visuel clair (déjà ajouté / en cours / ajouté) pour permettre des ajouts en rafale.

**Non-Goals:**
- Ne remplace pas la recherche "classique" par formulaire (conservée telle quelle pour la validation explicite).
- Pas de cache client des suggestions au-delà du debounce (pas de gestion offline).
- Pas de gestion de quota TMDb avancée (rate limiting, backoff) — hors scope de ce changement.

## Decisions

- **Debounce + seuil** : composant client (`"use client"`) avec `useState`/`useEffect` et un `setTimeout` de ~300ms, déclenché uniquement si `query.trim().length >= 3`. Alternative écartée : déclencher au 1er caractère (trop de requêtes TMDb) ou sur submit uniquement (ne répond pas au besoin).
- **Route API dédiée** (`GET /api/search/autocomplete?q=`) plutôt qu'une Server Action appelée depuis le client : une route HTTP permet l'annulation de requête (`AbortController`) proprement lors de la frappe rapide, ce qu'une server action ne permet pas nativement côté fetch client.
- **Server action combinée `quickAddToWatchlist(tmdbId, type)`** : encapsule `getOrRefreshMedia` + `addToWatchlist` pour que le composant autocomplete n'ait besoin que du `tmdbId`/`type` renvoyés par la recherche, sans connaître l'id DB. Colocalisée dans `src/lib/actions/watchlist.ts`.
- **État par suggestion** (idle / loading / added / error) géré localement dans le composant, pas de re-fetch global de la watchlist à chaque ajout (pas besoin de bloquer sur `revalidatePath` puisque l'utilisateur reste sur la page de recherche).
- **Fermeture/masquage du dropdown** : au clic en dehors, à l'Escape, ou quand `query.trim().length < 3`.

## Risks / Trade-offs

- [Risque] Volume d'appels TMDb en hausse (une requête par frappe post-debounce) → Mitigation : debounce 300ms + `AbortController` pour annuler les requêtes obsolètes ; réutilisation du cache `Media` (24h) pour les upserts déjà connus.
- [Risque] Ajouter un titre déjà présent en watchlist déclenche un upsert silencieux (comportement actuel de `addToWatchlist`, idempotent) → Mitigation : l'icône affiche un état "déjà dans la watchlist" basé sur la réponse de l'action, évite la confusion sans bloquer l'action (idempotence acceptée).
- [Risque] Dropdown de suggestions peut mal s'afficher sur mobile (espace réduit) → Mitigation : respecter le layout responsive existant (navigation inférieure mobile), tester l'affichage en dessous de 640px.

## Migration Plan

Pas de migration de données. Déploiement standard : ajout de fichiers (composant, route API, server action), aucune modification de schéma Prisma. Rollback = revert des fichiers ajoutés/modifiés.

## Open Questions

- Faut-il limiter le nombre de suggestions affichées (ex: top 5) pour garder le dropdown compact ? (proposition par défaut : oui, 5-8 résultats max, à trancher en implémentation).
