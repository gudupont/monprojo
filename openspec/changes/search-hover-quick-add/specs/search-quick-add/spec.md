## ADDED Requirements

### Requirement: Ajout rapide à la watchlist depuis la recherche
Le système DOIT permettre d'ajouter un résultat de recherche à la watchlist du profil actif en un clic, sans navigation vers la fiche détail.

#### Scenario: Ajout réussi depuis un résultat de recherche
- **WHEN** un profil actif clique sur le bouton "Ajouter à la watchlist" affiché au survol d'un résultat de `/search`
- **THEN** le système résout ou crée l'enregistrement `Media` local correspondant au `tmdbId`/`type` du résultat, puis ajoute (ou met à jour sans erreur si déjà présent) une entrée `WatchlistItem` pour ce profil

#### Scenario: Clic répété sur un média déjà dans la watchlist
- **WHEN** un profil actif clique sur "Ajouter à la watchlist" pour un média déjà présent dans sa watchlist
- **THEN** le système ne crée pas de doublon et n'affiche pas d'erreur

#### Scenario: Aucun profil actif
- **WHEN** un utilisateur sans profil actif déclenche l'ajout rapide à la watchlist
- **THEN** le système rejette l'action avec une erreur explicite, sans créer d'entrée watchlist

### Requirement: Planification rapide depuis la recherche
Le système DOIT permettre d'ouvrir le dialogue de planification pour un résultat de recherche et d'y créer une entrée de calendrier, sans navigation préalable vers la fiche détail.

#### Scenario: Ouverture du dialogue de planification depuis la recherche
- **WHEN** un profil actif clique sur le bouton "Planifier" affiché au survol d'un résultat de `/search`
- **THEN** le système affiche le dialogue de planification (date/heure, note optionnelle) pour ce résultat

#### Scenario: Soumission du dialogue de planification depuis la recherche
- **WHEN** un profil actif soumet le dialogue de planification ouvert depuis un résultat de recherche avec une date/heure valide
- **THEN** le système résout ou crée l'enregistrement `Media` local correspondant, crée une entrée `PlanEntry` associée à ce profil et à la date choisie, et ferme le dialogue

### Requirement: Actions rapides accessibles au clavier
Le système DOIT rendre les actions rapides (watchlist, planification) accessibles sans souris, en plus de l'affichage au survol.

#### Scenario: Navigation au clavier
- **WHEN** un utilisateur navigue vers un résultat de recherche via la touche Tab
- **THEN** les boutons d'action rapide de ce résultat deviennent visibles et activables (focus visible), au même titre qu'au survol souris
