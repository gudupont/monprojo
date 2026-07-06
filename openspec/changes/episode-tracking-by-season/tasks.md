## 1. Modèle de données (Prisma)

- [ ] 1.1 Ajouter les modèles `Season`, `Episode` et `EpisodeProgress` au schema Prisma (relations vers Série/Watchlist item et vers Profile)
- [ ] 1.2 Ajouter un identifiant externe stable (id source) sur `Season`/`Episode` pour la réconciliation avec la source de données
- [ ] 1.3 Ajouter un index composite `(profileId, episodeId)` sur `EpisodeProgress`
- [ ] 1.4 Générer et appliquer la migration Prisma
- [ ] 1.5 Valider que le conteneur Docker build correctement après ajout des modèles

## 2. Récupération des métadonnées épisodes

- [ ] 2.1 Étendre le pipeline existant de récupération de fiche série pour inclure la liste saisons/épisodes
- [ ] 2.2 Implémenter la persistance (upsert) des saisons/épisodes récupérés en base
- [ ] 2.3 Gérer le cas où aucune donnée épisode n'est disponible depuis la source

## 3. API Backend

- [ ] 3.1 Endpoint: lister les saisons et épisodes d'une série avec statut vu/non-vu pour le profil actif
- [ ] 3.2 Endpoint: marquer/démarquer un épisode comme vu (upsert/delete `EpisodeProgress`)
- [ ] 3.3 Endpoint: mass watch — marquer tous les épisodes d'une saison comme vus (opération atomique/transaction)
- [ ] 3.4 Endpoint: mass unwatch — marquer tous les épisodes d'une saison comme non vus (opération atomique/transaction)
- [ ] 3.5 Valider l'isolation par profil sur tous les endpoints (aucune fuite de données entre profils)
- [ ] 3.6 Gérer les erreurs de transaction sans état partiel (rollback complet en cas d'échec)

## 4. UI - Fiche détail série

- [ ] 4.1 Créer le composant "Section Épisodes" groupée par saison (accordéon/liste par saison)
- [ ] 4.2 Créer le composant ligne épisode avec case à cocher vu/non-vu
- [ ] 4.3 Créer le composant en-tête de saison avec bouton "Marquer la saison comme vue" / "Marquer la saison comme non vue" (état dynamique selon complétion)
- [ ] 4.4 Afficher la barre/pourcentage de progression par saison
- [ ] 4.5 Afficher le pourcentage de progression global de la série
- [ ] 4.6 Gérer l'état vide (aucun détail épisode disponible)
- [ ] 4.7 Adapter le layout responsive Desktop/Mobile pour la section épisodes

## 5. Intégration Watchlist

- [ ] 5.1 Dériver l'affichage de progression de la série dans la liste Watchlist à partir de l'état des épisodes
- [ ] 5.2 Vérifier la cohérence entre le statut affiché dans la Watchlist et celui de la fiche détail

## 6. Tests E2E (Playwright)

- [ ] 6.1 Scénario: marquer un épisode individuel comme vu/non-vu et vérifier la mise à jour de la progression
- [ ] 6.2 Scénario: mass watch d'une saison et vérification que tous les épisodes passent à vu
- [ ] 6.3 Scénario: mass unwatch d'une saison et vérification que tous les épisodes repassent à non-vu
- [ ] 6.4 Scénario: isolation entre deux profils sur la même série
- [ ] 6.5 Scénario: affichage correct de l'état vide quand aucun détail épisode n'est disponible

## 7. Vérification finale

- [ ] 7.1 Revue manuelle du flux complet (ouverture fiche → détail épisodes → mass watch → retour Watchlist)
- [ ] 7.2 Vérifier build Docker complet après toutes les modifications
