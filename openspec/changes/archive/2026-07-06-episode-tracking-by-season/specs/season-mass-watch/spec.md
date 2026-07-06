## ADDED Requirements

### Requirement: Validation groupée d'une saison entière
Le système SHALL permettre à l'utilisateur de marquer tous les épisodes d'une saison comme vus en une seule action, depuis l'en-tête de la saison.

#### Scenario: Marquer toute une saison comme vue
- **WHEN** l'utilisateur clique sur l'action "Marquer la saison comme vue" au niveau de l'en-tête d'une saison
- **THEN** le système marque tous les épisodes de cette saison comme vus pour le profil actif et met à jour la progression affichée pour la saison et pour la série

#### Scenario: Saison déjà entièrement vue
- **WHEN** l'utilisateur déclenche l'action "Marquer la saison comme vue" sur une saison dont tous les épisodes sont déjà vus
- **THEN** le système ne modifie aucun état et n'affiche aucune erreur (opération idempotente)

### Requirement: Annulation groupée d'une saison entière
Le système SHALL permettre à l'utilisateur de marquer tous les épisodes d'une saison comme non vus en une seule action, lorsque la saison est déjà entièrement ou partiellement vue.

#### Scenario: Décocher toute une saison
- **WHEN** l'utilisateur clique sur l'action "Marquer la saison comme non vue" sur une saison ayant au moins un épisode vu
- **THEN** le système marque tous les épisodes de cette saison comme non vus pour le profil actif et met à jour la progression affichée

### Requirement: Cohérence transactionnelle du mass watch
Le système SHALL appliquer la mise à jour groupée des épisodes d'une saison de façon atomique, sans état intermédiaire incohérent visible.

#### Scenario: Échec partiel lors du mass watch
- **WHEN** une erreur survient pendant l'enregistrement groupé des épisodes d'une saison
- **THEN** le système n'applique aucune modification partielle et affiche un message d'erreur à l'utilisateur, laissant l'état de la saison inchangé
