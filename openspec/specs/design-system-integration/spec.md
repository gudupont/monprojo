# Spec: Design System Integration

## Requirements

### Requirement: Layout responsive desktop/mobile
Le système SHALL fournir un layout d'application avec une barre latérale de navigation fixe sur desktop (5 items: Accueil, Recherche, Ma liste, Calendrier, Décider) et une top bar + navigation basse sur mobile, sans dupliquer la logique de navigation entre les deux.

#### Scenario: Affichage desktop
- **WHEN** la largeur de viewport est supérieure au breakpoint mobile (`md`)
- **THEN** la sidebar latérale est visible avec les 5 items de navigation et le compteur d'éléments dans la watchlist, et la top bar/nav mobile est masquée

#### Scenario: Affichage mobile
- **WHEN** la largeur de viewport est inférieure au breakpoint mobile (`md`)
- **THEN** la top bar (logo + icône recherche) et la navigation basse sont visibles, et la sidebar desktop est masquée

### Requirement: Charte graphique appliquée via tokens
Le système SHALL appliquer la charte graphique définie dans `CLAUDE.md` (fond `#0A0B0D`, surfaces `#15171B`/`#1C1F24`, bordures `#262A31`, accent `#E8A33D`, polices Instrument Serif pour les titres et Bricolage Grotesque pour le corps de texte) via des tokens CSS/Tailwind centralisés, sans valeurs codées en dur dispersées dans les composants.

#### Scenario: Titre d'écran
- **WHEN** un composant affiche un titre de section ou d'écran (ex: "Accueil", "Ma liste")
- **THEN** le titre utilise la police Instrument Serif et les couleurs de texte définies par les tokens de thème

#### Scenario: Item de navigation actif
- **WHEN** l'utilisateur se trouve sur un écran correspondant à un item de navigation (sidebar ou nav mobile)
- **THEN** cet item est visuellement marqué actif avec la couleur d'accent `#E8A33D` (ou la couleur du profil actif le cas échéant)

### Requirement: Écrans principaux portés depuis l'export design
Le système SHALL reproduire dans l'application Next.js les 5 écrans définis dans l'export design (Accueil avec "Continuer à regarder", Recherche, Ma liste, Calendrier, Décider), connectés aux données réelles (Prisma/server actions) plutôt qu'aux données mock de l'export.

#### Scenario: Écran Accueil avec reprises en cours
- **WHEN** l'utilisateur a des médias en cours de visionnage (progression > 0 et < 100%)
- **THEN** l'écran Accueil affiche une section "Continuer à regarder" avec une carte par média, sa barre de progression et son titre

#### Scenario: Écran Accueil sans reprise en cours
- **WHEN** l'utilisateur n'a aucun média en cours de visionnage
- **THEN** la section "Continuer à regarder" n'est pas affichée

### Requirement: Suppression des fichiers d'export bruts
Le système SHALL ne plus contenir les fichiers d'export bruts (`src/design/MonProjo.dc.html`, `src/design/support.js`) une fois tous les écrans portés et validés, afin qu'il n'existe qu'une seule source de vérité pour l'UI.

#### Scenario: Build après nettoyage
- **WHEN** tous les écrans de `src/design/` ont été portés et validés visuellement
- **THEN** le dossier `src/design/` est supprimé et `next build` continue de réussir sans référence à ces fichiers

### Requirement: Build de production valide
Le système SHALL produire un build de production (`next build`) sans erreur après intégration du design, incluant le linting (`next lint`).

#### Scenario: Build après portage complet
- **WHEN** tous les composants de layout et tous les écrans ont été portés
- **THEN** `next build` se termine avec un statut de succès et `next lint` ne rapporte aucune erreur bloquante
