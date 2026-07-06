## Why

Un export design de Claude Design (`src/design/MonProjo.dc.html` + `support.js`, format pseudo-JSX propriétaire avec balises `x-dc`, `sc-if`, `sc-for`) définit l'UI cible complète (sidebar desktop, top bar mobile, écrans Accueil/Recherche/Watchlist/Calendrier/Décider) avec la charte graphique du projet (polices, couleurs, dark mode). L'app Next.js actuelle (`src/app/**`, shadcn/ui) a déjà les routes et la logique serveur mais son UI ne reflète pas encore cette maquette. Il faut porter le design exporté vers les composants React/TSX réels et garantir que `next build` passe.

## What Changes

- Traduire la structure du fichier `.dc.html` (sidebar desktop, top bar + nav mobile, écrans Home/Search/Watchlist/Calendar/Decide) en composants React/TSX dans `src/components` et `src/app`.
- Extraire les styles inline (`{{ xxxStyle }}` définis dans `support.js`) vers Tailwind (classes utilitaires + tokens `globals.css`) en respectant la charte définie dans `CLAUDE.md` (couleurs, polices Instrument Serif / Bricolage Grotesque, dark mode).
- Adapter la navigation (`nav.tsx`) et les pages existantes (`page.tsx`, `search`, `watchlist`, `calendar`, `media/[type]`, `profiles`) pour consommer les nouveaux composants de layout/design sans casser les server actions existantes (`lib/actions/*`).
- Supprimer/déplacer les fichiers bruts de l'export (`src/design/`) une fois la traduction terminée (ils ne doivent pas rester dans `/src` en tant que source de vérité).
- Valider que `next build` (et `next lint`) passent sans erreur après intégration.

## Capabilities

### New Capabilities
- `design-system-integration`: Portage du design exporté (layout desktop/mobile, tokens visuels, écrans principaux) vers des composants Next.js/Tailwind réels, remplaçant le format pseudo-JSX de l'export.

### Modified Capabilities
(aucune spec existante — `openspec/specs/` est vide)

## Impact

- Code affecté: `src/components/nav.tsx`, `src/components/media-card.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, toutes les pages sous `src/app/**`.
- Nouveaux fichiers probables: composants de layout (sidebar, top bar mobile), tokens Tailwind/CSS pour la charte graphique.
- Dépendances: aucune nouvelle librairie externe (règle projet: pas de lib UI lourde si Tailwind/React suffit).
- Build/CI: `next build` doit rester vert; `src/design/` sera retiré du build une fois le portage terminé.
