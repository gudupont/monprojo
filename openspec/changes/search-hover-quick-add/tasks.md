## 1. Server actions

- [ ] 1.1 Ajouter `quickAddToWatchlist(tmdbId: number, type: TmdbMediaType)` dans `src/lib/actions/watchlist.ts` : appelle `getOrRefreshMedia`, puis la logique d'`addToWatchlist` (upsert), gère l'absence de profil actif avec la même erreur explicite que l'existant.
- [ ] 1.2 Ajouter `resolveAndCreatePlanEntry(formData: FormData)` dans `src/lib/actions/calendar.ts` : lit `tmdbId`/`type` du `FormData`, appelle `getOrRefreshMedia`, puis réutilise la logique de `createPlanEntry` pour créer le `PlanEntry`.
- [ ] 1.3 `revalidatePath` sur `/watchlist` et `/calendar` dans les deux nouvelles actions, comme pour les actions existantes.

## 2. MediaCard - overlay hover

- [ ] 2.1 Ajouter une prop optionnelle `hoverActions?: React.ReactNode` à `MediaCard` (`src/components/media-card.tsx`), rendue en overlay `absolute inset-0` sur le conteneur image, masqué par défaut et visible via `group-hover`/`group-focus-within` (le conteneur `Card` ou l'image passe en `group`).
- [ ] 2.2 Vérifier que les usages existants de `MediaCard` (watchlist, media detail le cas échéant) ne sont pas affectés (prop non fournie = aucun overlay rendu).

## 3. Composant client d'actions rapides

- [ ] 3.1 Créer `src/components/quick-add-actions.tsx` (client component) prenant `tmdbId`, `type`, `title` en props.
- [ ] 3.2 Bouton "Ajouter à la watchlist" : appelle `quickAddToWatchlist` via `useTransition`, état `pending` (disabled) puis `added` (icône/texte confirmé) après succès, gestion d'erreur simple (ex: état "erreur" transitoire).
- [ ] 3.3 Bouton "Planifier" : réutilise `PlanDialog`, adapté pour accepter soit `mediaId` direct soit `{ tmdbId, type }` (voir tâche 4).
- [ ] 3.4 S'assurer que les boutons sont focusables au clavier (pas de `tabIndex={-1}`) et visibles en `:focus-within` du parent.

## 4. PlanDialog - support tmdbId/type

- [ ] 4.1 Étendre les props de `PlanDialog` (`src/components/plan-dialog.tsx`) pour accepter `{ mediaId: string }` OU `{ tmdbId: number; type: TmdbMediaType }` en plus de `title`.
- [ ] 4.2 Adapter le `form action` du dialogue : si `mediaId` connu, comportement inchangé (`createPlanEntry`) ; sinon, poser `tmdbId`/`type` en champs cachés et soumettre à `resolveAndCreatePlanEntry`.

## 5. Intégration page de recherche

- [ ] 5.1 Dans `src/app/search/page.tsx`, passer `hoverActions={<QuickAddActions tmdbId={...} type={...} title={...} />}` à chaque `MediaCard` des résultats.
- [ ] 5.2 Vérifier que `type` transmis est bien `"movie" | "tv"` (cohérent avec le typage existant de `MediaCard`/`searchMedia`).

## 6. Vérification

- [ ] 6.1 Test manuel : depuis `/search`, ajouter un résultat jamais visité à la watchlist et vérifier son apparition sur `/watchlist`.
- [ ] 6.2 Test manuel : depuis `/search`, planifier un résultat jamais visité et vérifier son apparition sur `/calendar`.
- [ ] 6.3 Test manuel : vérifier l'accessibilité clavier (Tab jusqu'au résultat, actions visibles et activables).
- [ ] 6.4 Vérifier qu'un double-clic rapide sur "Ajouter à la watchlist" ne crée pas de doublon ni d'erreur.
- [ ] 6.5 `npm run build` (ou équivalent) pour valider le typage TypeScript de bout en bout.
