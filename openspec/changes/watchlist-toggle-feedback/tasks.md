## 1. Server actions

- [ ] 1.1 Factoriser la logique de suppression dans `src/lib/actions/watchlist.ts` (fonction privée partagée résolvant profil + clé `mediaId_profileId`)
- [ ] 1.2 Ajouter `removeFromWatchlistByMedia(mediaId: string)` dans `src/lib/actions/watchlist.ts`, réutilisant la logique factorisée
- [ ] 1.3 Faire retourner à `addToWatchlist` l'`id` du `WatchlistItem` créé/existant

## 2. Composant Toast

- [ ] 2.1 Créer `src/components/ui/toast.tsx` (composant `Toast` + `ToastProvider` en Context React, styles thème sombre du projet)
- [ ] 2.2 Exposer un hook `useToast()` avec `toast.success(message)` / `toast.error(message)`, auto-dismiss ~3s, `role="status"` / `aria-live="polite"`
- [ ] 2.3 Monter `ToastProvider` dans `src/app/layout.tsx`

## 3. Bouton toggle watchlist

- [ ] 3.1 Créer le composant client `src/components/watchlist-toggle-button.tsx` (props `mediaId`, `initialItemId: string | null`)
- [ ] 3.2 Gérer l'état local (ajouté/non ajouté) et le chargement via `useTransition`
- [ ] 3.3 Appeler `addToWatchlist` / `removeFromWatchlistByMedia` selon l'état courant
- [ ] 3.4 Déclencher `useToast()` sur succès ("Ajouté à la watchlist" / "Retiré de la watchlist") et sur erreur (message d'erreur, état du bouton inchangé)

## 4. Intégration page détail média

- [ ] 4.1 Dans `src/app/media/[type]/[tmdbId]/page.tsx`, requêter `db.watchlistItem.findUnique` (clé composite `mediaId_profileId`) en parallèle des autres appels existants
- [ ] 4.2 Remplacer le `<form action={addToWatchlist.bind(...)}>` actuel par `<WatchlistToggleButton mediaId={...} initialItemId={...} />`

## 5. Vérification

- [ ] 5.1 Vérifier manuellement (ou via test Playwright) : ajout d'un média absent → bouton devient "Retirer" + toast de confirmation
- [ ] 5.2 Vérifier manuellement (ou via test Playwright) : retrait d'un média présent → bouton redevient "Ajouter" + toast de confirmation
- [ ] 5.3 Vérifier qu'un profil différent ne voit pas l'état watchlist d'un autre profil pour le même média
- [ ] 5.4 `npm run build` / `next build` sans erreur TypeScript
