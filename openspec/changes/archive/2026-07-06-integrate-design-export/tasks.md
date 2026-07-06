## 1. Analyse et préparation

- [x] 1.1 Lire intégralement le bloc `data-dc-script` de `src/design/MonProjo.dc.html` (lignes 387+) et lister tous les objets de style (`{{ xxxStyle }}`) avec leurs valeurs
- [x] 1.2 Grep du repo pour toute référence existante à `src/design` (imports, config) afin de sécuriser la suppression finale
- [x] 1.3 Définir les tokens CSS (couleurs, rayons, ombres) dans `src/app/globals.css` à partir des constantes `ACCENT`, `TEXT`, `TEXTDIM`, `SURFACE`, `BORDER` repérées dans l'export

## 2. Layout global (sidebar + mobile)

- [x] 2.1 Créer `src/components/layout/sidebar.tsx` (nav desktop, 5 items, compteur watchlist)
- [x] 2.2 Créer `src/components/layout/mobile-top-bar.tsx` (logo + icône recherche)
- [x] 2.3 Créer `src/components/layout/mobile-bottom-nav.tsx` (nav basse mobile)
- [x] 2.4 Intégrer les 3 composants dans `src/app/layout.tsx` avec classes Tailwind responsive (`hidden md:flex` / `flex md:hidden`)
- [x] 2.5 Vérifier `next build` après intégration du layout

## 3. Écran Accueil

- [x] 3.1 Porter l'en-tête (eyebrow + greeting) et la section "Continuer à regarder" dans `src/app/page.tsx`
- [x] 3.2 Porter les cartes média (poster, titre, barre de progression) en réutilisant/étendant `src/components/media-card.tsx`
- [x] 3.3 Vérifier avec données réelles (seed Prisma) le cas "aucune reprise en cours"

## 4. Écran Recherche

- [x] 4.1 Porter la structure de l'écran recherche dans `src/app/search/page.tsx` selon l'export
- [x] 4.2 Vérifier l'intégration avec `lib/tmdb.ts` / `lib/omdb.ts` existants

## 5. Écran Ma liste (Watchlist)

- [x] 5.1 Porter la structure de l'écran watchlist dans `src/app/watchlist/page.tsx`
- [x] 5.2 Vérifier ajout/suppression/mise à jour de progression via `lib/actions/watchlist.ts`

## 6. Écran Calendrier

- [x] 6.1 Porter la structure de l'écran calendrier dans `src/app/calendar/page.tsx`
- [x] 6.2 Vérifier l'intégration avec `lib/actions/calendar.ts`

## 7. Écran Décider

- [x] 7.1 Vérifier si une route `decide` existe déjà; sinon créer `src/app/decide/page.tsx`
- [x] 7.2 Porter l'UI de tirage au sort avec filtres depuis l'export
- [x] 7.3 Ajouter l'item "Décider" dans la sidebar/nav mobile si absent

## 8. Nettoyage et validation finale

- [x] 8.1 Supprimer `src/design/` (MonProjo.dc.html, support.js, .thumbnail) après validation visuelle de tous les écrans
- [x] 8.2 Lancer `next build` et `next lint`, corriger toute erreur
- [x] 8.3 Vérification manuelle des écrans en dev server (desktop + mobile) sur les cas critiques listés dans `CLAUDE.md` (navigation, watchlist CRUD, Décider, changement de profil)
