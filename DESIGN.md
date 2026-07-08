---
name: MonProjo
description: Outil personnel de planification et suivi de visionnage de séries et films.
colors:
  mp-bg: "#0a0b0d"
  mp-surface: "#15171b"
  mp-surface-2: "#1c1f24"
  mp-border: "#262a31"
  mp-text: "#f3f1ec"
  mp-text-dim: "#93949c"
  mp-text-faint: "#5c5e66"
  mp-accent: "#e8a33d"
  mp-accent-ink: "#181004"
  destructive: "oklch(0.577 0.245 27.325)"
typography:
  display:
    fontFamily: "Instrument Serif, serif"
    fontSize: "1.75rem"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "normal"
  body:
    fontFamily: "var(--font-sans)"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "var(--font-sans)"
    fontSize: "0.8rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "normal"
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
spacing:
  sm: "8px"
  md: "12px"
  lg: "16px"
components:
  button-primary:
    backgroundColor: "{colors.mp-accent}"
    textColor: "{colors.mp-accent-ink}"
    rounded: "{rounded.md}"
    padding: "10px 14px"
  button-primary-hover:
    backgroundColor: "{colors.mp-accent}"
  nav-item-active:
    backgroundColor: "{colors.mp-surface-2}"
    textColor: "{colors.mp-text}"
    rounded: "{rounded.lg}"
  card:
    backgroundColor: "{colors.mp-surface}"
    textColor: "{colors.mp-text}"
    rounded: "{rounded.xl}"
---

# Design System: MonProjo

## 1. Overview

**Creative North Star: "The Amber Screening Room"**

MonProjo se comporte comme une salle de projection privée : presque tout l'espace reste dans le noir profond (#0A0B0D), et un unique point chaud, l'ambre (#E8A33D), signale ce qui mérite l'attention (l'action principale, la progression en cours, le compteur de la liste). L'italique serif du logo apporte une touche cinéma sans virer vers le générique de film hollywoodien.

Le système rejette explicitement le vocabulaire SaaS générique : pas de dashboard bleu/violet interchangeable, pas de grilles de cartes icône+titre répétées à l'identique, pas de hero-metric à gradient. Il rejette aussi le clone streaming pur (Netflix/Prime) : le fond sombre et les posters rapprochent visuellement, mais la disposition, la typographie serif et le traitement plat des surfaces gardent une identité propre à MonProjo.

**Key Characteristics:**
- Fond profond quasi uniforme, trois niveaux de surface seulement (bg / surface / surface-2)
- Un seul accent chaud (ambre), utilisé avec parcimonie
- Surfaces plates : séparation par bordure fine (ring 1px) plutôt que par ombre
- Serif italique réservé au nom de marque et aux gros chiffres (compteurs, progression)

## 2. Colors

Palette restreinte : neutres sombres tintés + un seul accent chaud porté sur moins de 10% de chaque écran.

### Primary
- **Warm Projector Amber** (#E8A33D): action principale, état actif, focus ring, chiffres mis en avant (compteur "dans ma liste", progression). Jamais utilisé en grande surface, toujours en point ou en texte.

### Neutral
- **Void Black** (#0A0B0D): fond de page (`mp-bg`), aussi couleur du logo/sidebar.
- **Near-Black Surface** (#15171B): cartes et panneaux de premier niveau (`mp-surface`).
- **Raised Surface** (#1C1F24): éléments actifs/survolés, deuxième niveau d'élévation (`mp-surface-2`).
- **Hairline Border** (#262A31): toutes les séparations, ring de carte, bordure de sidebar (`mp-border`).
- **Warm Off-White** (#F3F1EC): texte principal (`mp-text`), jamais blanc pur.
- **Dimmed Text** (#93949C): texte secondaire, labels (`mp-text-dim`).
- **Faint Text** (#5C5E66): texte tertiaire, désactivé (`mp-text-faint`).

### Named Rules
**The One Accent Rule.** L'ambre ne couvre jamais plus de 10% d'un écran donné. Sa rareté est ce qui lui donne du poids : bouton principal, focus, ou un seul chiffre clé par écran, jamais une bande de couleur.

## 3. Typography

**Display Font:** Instrument Serif (serif), utilisé en italique pour le nom de marque
**Body Font:** police système sans-serif (`var(--font-sans)`, stack Geist)
**Label/Mono Font:** `var(--font-mono)` (Geist Mono), réservé aux valeurs techniques si besoin

**Character:** Un empilement chaleureux-technique : le serif italique apporte la touche cinéma/éditoriale sur la marque et les gros chiffres, le sans-serif porte tout le reste avec neutralité pour ne pas fatiguer en lecture longue (listes, descriptions).

### Hierarchy
- **Display** (400, 1.75rem, line-height 1.1): nom de marque, gros compteurs (nombre "dans ma liste"), titres de carte importants. Toujours en `font-heading`.
- **Title** (500, 1rem, line-height 1.3): titres de carte standard (`CardTitle`), noms de médias.
- **Body** (400, 0.875rem, line-height 1.5): texte courant, descriptions, contenu de carte. Cap 65-75ch sur les blocs de texte long.
- **Label** (500, 0.8rem, line-height 1.2): libellés de navigation, labels de bouton, texte de badge.

### Named Rules
**The Serif-For-Signal Rule.** Instrument Serif italique n'apparaît que sur la marque et les chiffres qui comptent vraiment (compteur watchlist, progression). Jamais sur un titre de section ou un corps de texte : ce serait diluer le signal.

## 4. Elevation

MonProjo est un système plat par choix : pas d'ombre portée visible nulle part dans le code. La profondeur se lit par la superposition de trois tons de fond (bg → surface → surface-2) et par un `ring-1` fin (`ring-foreground/10`) autour des cartes, jamais par un `box-shadow`.

### Named Rules
**The Flat-By-Default Rule.** Aucune ombre. La hiérarchie visuelle vient de la tonalité de fond et d'une bordure de 1px, pas d'un flou projeté.

## 5. Components

### Buttons
- **Shape:** coins doux (`rounded-lg`, ~10px), variante d'action de la barre de détail passée à `rounded-full` pour ce contexte précis (voir spec `detail-page-action-buttons`).
- **Primary:** fond ambre (#E8A33D) plein, texte quasi-noir (#181004) pour un contraste fort ; hover assombrit légèrement (`bg-primary/80`).
- **Outline / Secondary / Ghost:** fond transparent ou surface secondaire (#1C1F24), texte neutre ; réservés aux actions non prioritaires.
- **Hover / Focus:** transition douce sur le fond, ring de focus ambre (`focus-visible:ring-ring/50`), micro-décalage vertical au clic (`translate-y-px`).
- **Icônes:** icône Lucide 16px avant le libellé sur les boutons d'action de la page détail, jamais d'icône seule sans libellé sauf variante `icon`.

### Cards / Containers
- **Corner Style:** `rounded-xl` (~14px).
- **Background:** `mp-surface` (#15171B) sur fond `mp-bg`.
- **Shadow Strategy:** aucune (voir Elevation) ; séparation par `ring-1 ring-foreground/10`.
- **Border:** pas de bordure épaisse ; le ring fin fait office de contour.
- **Internal Padding:** échelle `--card-spacing`, 12px (compact) à 16px (défaut).

### Navigation
- **Sidebar (desktop):** fond `mp-bg`, largeur fixe 240px, item actif = fond `mp-surface-2` + texte en gras, item inactif = texte `mp-text-dim` sans fond. Icônes Lucide 20px, `strokeWidth 1.8`.
- **Bottom nav (mobile):** même vocabulaire de couleur, adapté en barre basse fixe.
- **Focus/hover:** pas de soulignement, uniquement changement de fond (`rounded-[10px]`).

### Compteur signature
Bloc "dans ma liste" en bas de sidebar : carte `mp-surface` avec bordure `mp-border`, chiffre en `font-heading` 28px couleur ambre au-dessus d'un label `mp-text-dim` en petit texte. C'est le seul endroit où le serif affiche une valeur numérique en avant-plan.

## 6. Do's and Don'ts

### Do:
- **Do** garder l'ambre (#E8A33D) sous 10% de la surface de chaque écran, réservé à l'action principale et aux chiffres clés.
- **Do** utiliser trois tons de fond seulement (bg #0A0B0D, surface #15171B, surface-2 #1C1F24) pour toute la hiérarchie de profondeur.
- **Do** séparer les surfaces par un ring/bordure de 1px (`mp-border` #262A31), jamais par une ombre.
- **Do** réserver Instrument Serif italique à la marque et aux gros chiffres (progression, compteurs), pas aux titres courants.
- **Do** appliquer le pattern icône 16px + libellé + `rounded-full` sur les boutons de la barre d'action de la page détail (spec `detail-page-action-buttons`).

### Don't:
- **Don't** utiliser de dashboard bleu/violet générique ni de grille de cartes icône+titre répétées à l'identique : c'est le cliché SaaS que MonProjo rejette explicitement.
- **Don't** copier tel quel l'UI Netflix/Prime malgré la thématique proche : pas de bande latérale colorée, pas de carousel générique de plateforme de streaming.
- **Don't** utiliser `box-shadow` décoratif ou de glassmorphism : le système est plat par doctrine (voir The Flat-By-Default Rule).
- **Don't** utiliser de texte en dégradé (`background-clip: text`) : l'emphase se fait par le poids ou la taille, jamais par un gradient sur le texte.
- **Don't** utiliser une bordure latérale colorée (`border-left`/`border-right` épaisse) comme accent décoratif sur une carte ou un item de liste.
- **Don't** utiliser #000 ou #FFF purs : tous les neutres sont teintés (#0A0B0D, #F3F1EC).
