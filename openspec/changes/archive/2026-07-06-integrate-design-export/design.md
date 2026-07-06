## Context

`src/design/MonProjo.dc.html` (1006 lignes) + `src/design/support.js` (1687 lignes, moteur runtime générique des exports "Claude Design") sont un export brut au format pseudo-JSX propriétaire (`x-dc`, `sc-if`, `sc-for`, `{{ expr }}`). Ce n'est pas du code exécutable dans Next.js: `support.js` est un runtime de rendu (custom elements, diffing) indépendant du projet, et les styles/état sont définis dans un bloc `<script type="text/x-dc" data-dc-script>` (à partir de la ligne 387) sous forme d'objets JS (`navStyle`, `homeTitleStyle`, etc.) utilisant des constantes de couleur (`ACCENT`, `TEXT`, `TEXTDIM`, `SURFACE`...) déjà cohérentes avec la charte définie dans `CLAUDE.md`.

L'app cible (`src/app/**`) existe déjà en Next.js 16 (App Router) + React 19 + Tailwind v4 + shadcn/ui (`src/components/ui/*`), avec des server actions Prisma fonctionnelles. Le travail est donc un portage de présentation (layout, styles, structure d'écran), pas une réécriture de la logique métier.

## Goals / Non-Goals

**Goals:**
- Reproduire fidèlement la structure de layout (sidebar desktop fixe + nav 5 items, top bar + nav bas mobile) et les 5 écrans principaux (Accueil, Recherche, Ma liste, Calendrier, Décider) tels que définis dans l'export.
- Convertir les objets de style inline (`{{ xStyle }}`) en classes Tailwind (ou CSS Modules/`globals.css` tokens quand une valeur est réutilisée: couleurs, rayons, polices), en respectant les valeurs exactes de `CLAUDE.md` (fond `#0A0B0D`, surfaces `#15171B`/`#1C1F24`, bordures `#262A31`, accent `#E8A33D`, polices Instrument Serif / Bricolage Grotesque).
- Garder `next build` et `next lint` verts.
- Retirer `src/design/` du repo une fois la traduction validée (fichiers sources bruts, non destinés à rester dans l'app).

**Non-Goals:**
- Ne pas introduire de nouvelle librairie UI (règle projet: Tailwind/React standard uniquement).
- ~~Ne pas modifier la logique des server actions (`lib/actions/*`) ni le schéma Prisma.~~ **Révisé (2026-07-06):** le schéma Prisma initial n'a ni genres, ni saisons/épisodes, ni tracking par épisode — incompatible avec les écrans Accueil/Détail/Décider du mock (progression par épisode, filtre par genre). Décision utilisateur: étendre le schéma plutôt que dégrader l'UI. Ajouts: `Media.genres` (string, genres TMDB joints), `Media.seasonsJson` (JSON des saisons/épisodes TMDB), modèle `EpisodeWatch` (progression par profil/média/saison/épisode). Cache alimenté via `lib/tmdb.ts` + `lib/actions/media.ts` existants (pas de nouvel appel API dédié). "Décider" et "Continuer à regarder" restent scopés à la watchlist du profil actif (pas de découverte TMDB live) et "Sorties à venir" réutilise le planning manuel existant (`PlanEntry`), pas de release-tracking TMDB automatique.
- Ne pas essayer de faire tourner `support.js` tel quel dans l'app (c'est un runtime de prototypage, pas un composant réutilisable).
- Ne pas traiter ici les tests E2E Playwright (hors scope de ce change; peut faire l'objet d'un change séparé).

## Decisions

1. **Traduction manuelle statique plutôt qu'exécution du runtime `x-dc`**: `support.js` est un moteur de rendu générique pour l'outil Claude Design, pas une dépendance du projet. Alternative rejetée: importer `support.js` tel quel dans Next.js (introduirait un runtime custom-elements non-SSR-safe, incompatible avec App Router/RSC).
2. **Mapping style-objet → Tailwind**: chaque `{{ xxxStyle }}` du `.dc.html` est retrouvé dans le bloc `data-dc-script` (objets JS) et traduit en classes Tailwind utilitaires; les valeurs de couleur/police récurrentes (ACCENT, TEXT, TEXTDIM, SURFACE, BORDER) deviennent des tokens CSS custom properties dans `globals.css` (`--color-accent`, etc.) pour éviter la duplication et permettre les variations de profils (`#E5484D`, `#3FA3A0`, `#3E6FBF`, `#C9668A`, `#7C5CBF`).
3. **Découpage composants**: layout (`Sidebar`, `MobileTopBar`, `MobileBottomNav`) extraits dans `src/components/layout/`; contenu par écran mappé sur les pages existantes (`src/app/page.tsx` = Accueil, `src/app/search/page.tsx`, `src/app/watchlist/page.tsx`, `src/app/calendar/page.tsx`, et un nouvel écran "Décider" si absent). Alternative rejetée: un seul gros composant monolithique — rejeté pour respecter la règle "fichiers < 500 lignes" et la structure App Router déjà en place.
4. **Responsive**: reproduction du pattern `sc-if isMobile / isDesktop` via Tailwind responsive classes (`hidden md:flex` / `flex md:hidden`) plutôt qu'un état JS `isMobile`, pour rester SSR-friendly et éviter le flash de contenu.
5. **Suppression de `src/design/`**: une fois chaque écran/porté validé (checklist dans tasks.md), le dossier est supprimé du repo — il ne doit pas rester comme source de vérité concurrente du code réel.

## Risks / Trade-offs

- [Risque: divergence visuelle subtile entre l'export statique (mock data) et l'app connectée à Prisma/OMDB/TMDB] → Mitigation: valider visuellement chaque écran avec données réelles/seed après portage, pas seulement contre le mock.
- [Risque: perte de détails de style lors de la traduction manuelle objet→Tailwind (1006 lignes)] → Mitigation: portage écran par écran avec revue croisée du bloc `data-dc-script` correspondant, tâche dédiée par écran dans tasks.md.
- [Risque: régression sur composants shadcn déjà en place (`button.tsx`, `card.tsx`, etc.)] → Mitigation: réutiliser/étendre les composants `ui/*` existants plutôt que les dupliquer; `next build` + vérification manuelle des écrans déjà fonctionnels après chaque étape.
- [Risque: build Docker cassé si `src/design/` est référencé ailleurs] → Mitigation: grep du repo pour toute référence à `src/design` avant suppression.

## Migration Plan

1. Porter le layout global (sidebar + top bar/nav mobile) dans `src/components/layout/`.
2. Porter écran par écran (Accueil → Recherche → Ma liste → Calendrier → Décider), en réutilisant les data/actions déjà câblées dans chaque `page.tsx`.
3. Après chaque écran porté: `next build` + vérification visuelle manuelle (dev server).
4. Une fois tous les écrans validés: supprimer `src/design/` (avec confirmation utilisateur, suppression de fichiers hors scratchpad).
5. Rollback: le portage se fait par petits commits par écran; en cas de régression, revert du commit de l'écran concerné sans affecter les autres.

## Open Questions

- L'écran "Décider" (tirage au sort) existe-t-il déjà côté app (`src/app/**`) ou faut-il créer une nouvelle route ? À vérifier lors du portage (aucune route `decide` trouvée dans le listing actuel de `src/app`).
- Faut-il conserver `src/design/` archivé ailleurs (ex: `openspec/changes/.../assets`) avant suppression, pour référence future ? Décision par défaut: non, git history suffit.
