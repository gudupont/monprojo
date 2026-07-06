## ADDED Requirements

### Requirement: Déclenchement de l'autocomplete par seuil de caractères
Le système SHALL déclencher une recherche de suggestions uniquement lorsque le texte saisi dans le champ de recherche contient au moins 3 caractères (hors espaces en début/fin), avec un debounce d'environ 300ms après la dernière frappe.

#### Scenario: Moins de 3 caractères saisis
- **WHEN** l'utilisateur a saisi 1 ou 2 caractères dans le champ de recherche
- **THEN** aucune requête de suggestion n'est envoyée et aucun dropdown ne s'affiche

#### Scenario: 3 caractères ou plus saisis
- **WHEN** l'utilisateur a saisi au moins 3 caractères et cesse de taper pendant ~300ms
- **THEN** une requête de suggestions est envoyée et le dropdown affiche les résultats correspondants

#### Scenario: Frappe rapide successive
- **WHEN** l'utilisateur tape plusieurs caractères rapidement avant la fin du debounce
- **THEN** seule la dernière requête (après la dernière frappe) est prise en compte ; les requêtes précédentes en vol sont annulées

### Requirement: Affichage des suggestions
Le système SHALL afficher, pour chaque suggestion, le titre, l'année (si disponible), le type (film/série) et le poster (si disponible), dans un dropdown positionné sous le champ de recherche.

#### Scenario: Résultats disponibles
- **WHEN** la recherche de suggestions retourne au moins un résultat
- **THEN** le dropdown affiche la liste des suggestions avec titre, année, type et poster

#### Scenario: Aucun résultat
- **WHEN** la recherche de suggestions ne retourne aucun résultat
- **THEN** le dropdown affiche un message indiquant l'absence de résultat

#### Scenario: Fermeture du dropdown
- **WHEN** l'utilisateur clique en dehors du dropdown, appuie sur Échap, ou réduit sa saisie à moins de 3 caractères
- **THEN** le dropdown de suggestions se ferme

### Requirement: Ajout rapide à la watchlist depuis une suggestion
Le système SHALL permettre d'ajouter un média à la watchlist du profil actif directement depuis une suggestion de l'autocomplete, via une icône dédiée, sans navigation ni rechargement de page.

#### Scenario: Ajout réussi
- **WHEN** l'utilisateur clique sur l'icône d'ajout d'une suggestion
- **THEN** le média est résolu/mis en cache en base (upsert TMDb → DB) puis ajouté à la watchlist du profil actif, et l'icône passe dans un état "ajouté"

#### Scenario: Média déjà présent dans la watchlist
- **WHEN** l'utilisateur clique sur l'icône d'ajout d'un média déjà présent dans sa watchlist
- **THEN** l'opération reste sans erreur (idempotente) et l'icône reflète l'état "déjà dans la watchlist"

#### Scenario: Ajouts multiples successifs
- **WHEN** l'utilisateur ajoute plusieurs suggestions différentes à la suite sans fermer le dropdown
- **THEN** chaque ajout est traité indépendamment et son propre état visuel (idle/loading/ajouté/erreur) est mis à jour sans affecter les autres suggestions

#### Scenario: Erreur lors de l'ajout
- **WHEN** l'ajout d'un média à la watchlist échoue (ex: pas de profil actif, erreur serveur)
- **THEN** l'icône affiche un état d'erreur et l'utilisateur peut réessayer sans recharger la page

### Requirement: Isolation par profil
Le système SHALL ajouter le média à la watchlist du profil actuellement actif uniquement, conformément au comportement existant de la watchlist.

#### Scenario: Profil actif défini
- **WHEN** un profil est actif au moment de l'ajout rapide
- **THEN** le média est ajouté à la watchlist de ce profil et n'apparaît pas dans celles des autres profils
