# Product

## Register

product

## Users
Toi et tes proches (usage perso/famille), plusieurs profils isolés par foyer. Contexte d'usage : soir, canapé, décision rapide de ce qu'on va regarder, ou suivi de progression sur une série en cours. Pas un usage professionnel, pas de collaboration multi-organisation.

## Product Purpose
MonProjo planifie et suit le visionnage de séries et films : ajouter à une liste, marquer la progression épisode par épisode, calendrier des sorties, tirage au sort ("Décide pour moi") quand on ne sait pas quoi regarder. Succès = retrouver en un coup d'œil où on en est, sans friction, profil par profil.

## Brand Personality
Chaleureux, premium, calme. Fond sombre profond, accent ambre (#E8A33D) utilisé avec retenue, typographie serif (Instrument Serif) pour les titres qui donne un ton élégant plutôt que "app tech". L'ambiance vise le cocooning soirée cinéma, pas l'énergie SaaS productivité.

## Anti-references
Pas de template SaaS générique (dashboards bleu/violet interchangeables, grilles de cartes icône+titre répétées à l'identique, hero-metric avec gradient). Pas de clone Netflix/Prime : le thème sombre et les posters rapprochent visuellement du streaming, mais la mise en page, la typographie serif et les interactions doivent rester identifiables comme MonProjo, pas une copie d'une plateforme existante.

## Design Principles
- Sobriété avant densité : peu d'accents, contraste net entre les rares zones colorées (#E8A33D) et les surfaces neutres.
- La progression est l'information reine : barres de progression, statuts de visionnage toujours lisibles en un coup d'œil, jamais noyés dans le décor.
- Un pattern d'action unique et prévisible (icône 16px + libellé, `rounded-full`) sur tous les boutons de la page détail, pas de variation ad hoc par écran.
- Responsive assumé : sidebar en desktop, navigation basse en mobile, jamais un simple rétrécissement du layout desktop.
- Isolation des profils visible dans l'UI, pas seulement dans les données.

## Accessibility & Inclusion
WCAG AA. Contrastes vérifiés sur fond sombre (#0A0B0D / #15171B / #1C1F24), focus clairement visible sur l'accent ambre, pas d'information portée uniquement par la couleur (statuts vu/non-vu doublés d'icône ou de texte).
