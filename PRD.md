# Product Requirements Document (PRD) : MonProjo

## 1. Vision et Objectifs
**MonProjo** est une application web de suivi et de planification de visionnage pour films et séries. L'objectif est d'offrir une expérience utilisateur fluide pour reprendre une lecture en cours, découvrir les prochaines sorties de ses séries favorites, et résoudre l'indécision grâce à un outil de recommandation aléatoire basé sur des filtres.

## 2. Public Cible
* Les passionnés de films et séries qui souhaitent centraliser leur suivi.
* Les foyers ou groupes d'amis nécessitant une gestion multi-profils (ex: Parents, Enfants) pour ne pas mélanger leurs historiques.

## 3. Fonctionnalités Principales (User Stories)

### 3.1. Gestion des Profils
* **US-1.1:** En tant qu'utilisateur, je peux créer, modifier et supprimer des profils (avec un nom et une couleur d'accentuation).
* **US-1.2:** En tant qu'utilisateur, je peux basculer d'un profil à un autre. Chaque profil possède sa propre liste de visionnage (Watchlist) et son propre historique (films/épisodes vus).

### 3.2. Tableau de bord (Accueil)
* **US-2.1:** Je vois un message de bienvenue personnalisé selon l'heure de la journée.
* **US-2.2:** Je peux reprendre mon visionnage là où je m'étais arrêté via un carrousel "Continuer à regarder" (progression calculée selon le nombre d'épisodes vus).
* **US-2.3:** Je suis notifié des sorties à venir concernant les séries que je suis.

### 3.3. Fiche Détail (Film/Série)
* **US-3.1:** Je peux voir les métadonnées de l'œuvre (Titre, Année, Synopsis, Casting, Note, Genre).
* **US-3.2:** S'il s'agit d'un film, je peux le marquer comme "Vu". S'il s'agit d'une série, je peux marquer individuellement chaque épisode de chaque saison comme "Vu".
* **US-3.3:** Je peux ajouter ou retirer l'œuvre de ma Watchlist.

### 3.4. Ma Liste (Watchlist)
* **US-4.1:** Je peux consulter ma liste de visionnage et la filtrer par : Tout, Films, Séries, En cours, Terminé.

### 3.5. Calendrier
* **US-5.1:** Je peux voir un calendrier listant les dates de diffusion des prochains épisodes des séries de ma Watchlist.

### 3.6. Décider (Random Picker)
* **US-6.1:** Si je suis indécis, je peux utiliser l'outil "Décide pour moi".
* **US-6.2:** Je peux filtrer la sélection aléatoire par Type (Film/Série) et par Genre.
* **US-6.3:** Je peux choisir d'exclure les œuvres que j'ai déjà terminées.
* **US-6.4:** Le résultat est présenté après une courte animation (spin) pour un effet ludique, avec la possibilité de relancer ou de lancer le visionnage.

## 4. Design et Expérience Utilisateur
* **Mode:** Dark mode imposé (`#0A0B0D`).
* **Responsive:** Navigation latérale (Sidebar) sur Desktop ; Navigation inférieure (Bottom Bar) sur Mobile.
* **Accessibilité:** Contrastes élevés (textes `#F3F1EC` et `#93949C`), feedback visuel clair lors des interactions (animations, boutons d'état).

## 5. État d'implémentation (2026-07-06)

Voir `ARCHITECTURE.md` pour le détail technique. Résumé fonctionnel :

| User story | État |
|---|---|
| US-1.1, US-1.2 (profils) | Implémenté (`/profiles`, cookie de session) |
| US-2.x (accueil, continuer à regarder, sorties à venir) | Non implémenté — `/` est un squelette vide |
| US-3.1, US-3.3 (fiche détail, watchlist) | Implémenté ; pas encore de feedback visuel ni de retrait (change `watchlist-toggle-feedback` en cours) |
| US-3.2 (validation épisode par épisode) | Non implémenté (change `episode-tracking-by-season` en cours) |
| US-4.1 (Watchlist filtrée) | Implémenté |
| US-5.1 (Calendrier) | Implémenté |
| US-6.1 à US-6.4 (Décider) | Non implémenté — aucune route `/decide`, aucun change OpenSpec associé pour l'instant |

Demandes utilisateur en cours de spécification (voir `openspec/changes/*` et `TASKS.md`) : autocomplete de recherche avec ajout rapide (dès 3 caractères), boutons d'ajout rapide au hover sur les résultats de recherche, détail des épisodes groupés par saison avec validation en masse par saison, feedback de confirmation lors de l'ajout/retrait watchlist, portage de la maquette `src/design/*` vers de vrais composants React/Tailwind.