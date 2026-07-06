## 1. Server action ajout rapide

- [ ] 1.1 Ajouter `quickAddToWatchlist(tmdbId: number, type: TmdbMediaType)` dans `src/lib/actions/watchlist.ts` : appelle `getOrRefreshMedia(tmdbId, type)` puis `addToWatchlist(media.id)`, retourne un statut (`added` / `already-in-watchlist`) exploitable par le client.
- [ ] 1.2 Gérer le cas "pas de profil actif" (retourner une erreur explicite plutôt que throw brut côté client).

## 2. Route API autocomplete

- [ ] 2.1 Créer `src/app/api/search/autocomplete/route.ts` (`GET`) : lit le paramètre `q`, valide `q.trim().length >= 3` (400/tableau vide sinon), appelle `searchMedia(q)`.
- [ ] 2.2 Limiter/mapper la réponse aux champs nécessaires (tmdbId, type, title, poster, releaseDate, tmdbRating) et tronquer à ~8 résultats.
- [ ] 2.3 Gérer les erreurs TMDb (retourner 500 avec message clair, ne pas planter la route).

## 3. Composant autocomplete (client)

- [ ] 3.1 Créer `src/components/search-autocomplete.tsx` (`"use client"`) : input contrôlé, debounce ~300ms, seuil 3 caractères, `AbortController` pour annuler les requêtes obsolètes.
- [ ] 3.2 Afficher le dropdown de suggestions (titre, année, badge type, poster) sous le champ, fermeture au clic extérieur / Échap / saisie < 3 caractères.
- [ ] 3.3 Ajouter l'icône d'ajout rapide par suggestion, avec état local par item (idle/loading/added/already-added/error) appelant `quickAddToWatchlist`.
- [ ] 3.4 Gérer le cas "aucun résultat" (message dans le dropdown).

## 4. Intégration page de recherche

- [ ] 4.1 Intégrer `SearchAutocomplete` dans `src/app/search/page.tsx` sous le formulaire existant, sans modifier le comportement de la recherche validée par submit.
- [ ] 4.2 Vérifier le rendu responsive (desktop sidebar / mobile bottom nav) et l'accessibilité clavier (navigation dans les suggestions, focus visible).

## 5. Vérification

- [ ] 5.1 Tester manuellement : saisie < 3 caractères (pas de requête), ≥ 3 caractères (suggestions), ajout rapide, ajout d'un doublon déjà en watchlist, changement de profil (isolation des données).
- [ ] 5.2 Vérifier `npm run build` / typecheck sans erreur après ajout des nouveaux fichiers.
- [ ] 5.3 (Si présent) ajouter/adapter un test E2E Playwright couvrant : saisie autocomplete → suggestions → ajout rapide → présence dans la watchlist du profil actif.
