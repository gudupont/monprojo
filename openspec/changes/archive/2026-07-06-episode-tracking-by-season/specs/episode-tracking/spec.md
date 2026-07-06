## ADDED Requirements

### Requirement: Affichage des épisodes groupés par saison
Le système SHALL afficher, dans la fiche détail d'une série de la Watchlist, la liste complète des épisodes disponibles groupée par saison.

#### Scenario: Ouverture de la fiche détail d'une série
- **WHEN** l'utilisateur ouvre la fiche détail d'une série présente dans sa Watchlist
- **THEN** le système affiche une section "Épisodes" listant toutes les saisons disponibles, chaque saison affichant ses épisodes (numéro et titre)

#### Scenario: Série sans détail épisodes disponible
- **WHEN** aucune métadonnée épisode n'est disponible pour la série depuis la source de données
- **THEN** le système affiche un état vide indiquant qu'aucun détail épisode n'est disponible, sans bloquer le reste de la fiche

### Requirement: Marquage individuel d'un épisode comme vu
Le système SHALL permettre à l'utilisateur de marquer un épisode comme vu ou non vu individuellement.

#### Scenario: Marquer un épisode comme vu
- **WHEN** l'utilisateur coche un épisode non vu dans la liste
- **THEN** le système enregistre l'épisode comme vu pour le profil actif et met à jour l'affichage immédiatement

#### Scenario: Décocher un épisode déjà vu
- **WHEN** l'utilisateur décoche un épisode marqué comme vu
- **THEN** le système enregistre l'épisode comme non vu pour le profil actif et met à jour l'affichage immédiatement

### Requirement: Isolation du statut de visionnage par profil
Le système SHALL conserver l'état vu/non-vu de chaque épisode de façon isolée par profil utilisateur.

#### Scenario: Deux profils sur la même série
- **WHEN** deux profils différents consultent la fiche détail de la même série
- **THEN** chaque profil voit uniquement son propre état de progression, indépendant de celui de l'autre profil

### Requirement: Calcul de la progression de complétion
Le système SHALL calculer et afficher un pourcentage de complétion par saison et un pourcentage global pour la série, dérivés du nombre d'épisodes marqués vus.

#### Scenario: Progression partielle d'une saison
- **WHEN** l'utilisateur a marqué 3 épisodes sur 10 d'une saison comme vus
- **THEN** le système affiche 30% de complétion pour cette saison

#### Scenario: Progression globale de la série
- **WHEN** l'utilisateur consulte la fiche détail d'une série comportant plusieurs saisons
- **THEN** le système affiche un pourcentage de complétion global basé sur le total des épisodes vus sur le total des épisodes de la série
