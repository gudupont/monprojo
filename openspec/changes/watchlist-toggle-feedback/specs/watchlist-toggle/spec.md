## ADDED Requirements

### Requirement: Détection de l'état watchlist sur la page détail
La page détail d'un média (film ou série) SHALL déterminer, au moment du rendu, si le média est déjà présent dans la watchlist du profil actif.

#### Scenario: Média absent de la watchlist
- **WHEN** l'utilisateur consulte la page détail d'un média qui n'est pas dans sa watchlist
- **THEN** le bouton affiché est "Ajouter à ma watchlist"

#### Scenario: Média déjà présent dans la watchlist
- **WHEN** l'utilisateur consulte la page détail d'un média déjà présent dans la watchlist de son profil actif
- **THEN** le bouton affiché est "Retirer de la watchlist"

### Requirement: Empêcher le doublon d'ajout
Le système SHALL empêcher qu'un même média soit ajouté deux fois à la watchlist d'un même profil, aussi bien au niveau des données que de l'interface.

#### Scenario: Clic répété sur "Ajouter"
- **WHEN** un média est déjà dans la watchlist du profil actif
- **THEN** l'interface ne propose plus l'action "Ajouter à ma watchlist" pour ce média mais uniquement "Retirer de la watchlist"

### Requirement: Bascule Ajouter / Retirer
Le bouton d'action sur la page détail média SHALL basculer entre l'ajout et le retrait de la watchlist selon l'état courant, sans rechargement complet de la page.

#### Scenario: Ajout à la watchlist
- **WHEN** l'utilisateur clique sur "Ajouter à ma watchlist" pour un média absent de sa watchlist
- **THEN** le média est ajouté à la watchlist du profil actif
- **THEN** le bouton devient "Retirer de la watchlist" sans rechargement de page

#### Scenario: Retrait de la watchlist
- **WHEN** l'utilisateur clique sur "Retirer de la watchlist" pour un média présent dans sa watchlist
- **THEN** le média est retiré de la watchlist du profil actif
- **THEN** le bouton redevient "Ajouter à ma watchlist" sans rechargement de page

### Requirement: Message de confirmation
Le système SHALL afficher un message de confirmation visuel et temporaire après chaque action réussie d'ajout ou de retrait de la watchlist.

#### Scenario: Confirmation après ajout
- **WHEN** l'ajout d'un média à la watchlist réussit
- **THEN** un message de confirmation (ex. "Ajouté à la watchlist") s'affiche puis disparaît automatiquement après quelques secondes

#### Scenario: Confirmation après retrait
- **WHEN** le retrait d'un média de la watchlist réussit
- **THEN** un message de confirmation (ex. "Retiré de la watchlist") s'affiche puis disparaît automatiquement après quelques secondes

#### Scenario: Échec de l'action
- **WHEN** l'ajout ou le retrait échoue (ex. erreur serveur)
- **THEN** un message d'erreur s'affiche et l'état du bouton ne change pas
