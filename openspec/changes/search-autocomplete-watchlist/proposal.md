## Why

La recherche actuelle nécessite de valider le formulaire et de recharger la page pour voir les résultats, puis d'ouvrir la fiche média pour l'ajouter à la watchlist. C'est lent pour ajouter plusieurs titres à la suite. Un autocomplete (dès 3 caractères) avec un bouton d'ajout rapide directement dans les résultats, façon Plex, permet d'enchaîner les ajouts sans changer de page.

## What Changes

- Ajout d'un composant de recherche autocomplete (client-side, debounced) déclenché à partir de 3 caractères saisis.
- Nouvelle route API `GET /api/search/autocomplete?q=` qui appelle `searchMedia` (TMDb) et retourne une liste compacte (titre, poster, année, type, tmdbId).
- Chaque résultat de l'autocomplete affiche une icône d'ajout rapide qui, au clic, ajoute le média à la watchlist du profil actif sans quitter la page de recherche.
- Nouvelle server action `quickAddToWatchlist(tmdbId, type)` qui enchaîne `getOrRefreshMedia` (upsert TMDb → DB) puis `addToWatchlist(mediaId)`.
- Retour visuel immédiat sur l'icône (état "ajouté" / déjà présent) pour permettre d'ajouter plusieurs titres rapidement sans confusion.
- La page de recherche existante (formulaire + résultats grille) reste inchangée pour les recherches validées ; l'autocomplete est un complément qui apparaît sous le champ de recherche pendant la saisie.

## Capabilities

### New Capabilities
- `search-autocomplete`: Recherche incrémentale (debounce, seuil 3 caractères) avec suggestions TMDb et ajout rapide à la watchlist depuis la liste de suggestions.

### Modified Capabilities
(aucune - pas de spec existante dans `openspec/specs/`)

## Impact

- **Code** : `src/app/search/page.tsx` (intégration du composant), nouveau composant client (ex: `src/components/search-autocomplete.tsx`), nouvelle route `src/app/api/search/autocomplete/route.ts`, nouvelle server action dans `src/lib/actions/watchlist.ts` ou `media.ts`.
- **Dépendances** : réutilise `searchMedia` (`src/lib/tmdb.ts`), `getOrRefreshMedia` (`src/lib/actions/media.ts`), `addToWatchlist` (`src/lib/actions/watchlist.ts`), `getActiveProfile` (`src/lib/session.ts`).
- **API externe** : appels TMDb plus fréquents (un appel par frappe après debounce) — à surveiller côté quota/rate limit.
- **UI** : nouveau composant visuel (dropdown de suggestions) à styler selon la charte du projet (dark mode, accent `#E8A33D`).
