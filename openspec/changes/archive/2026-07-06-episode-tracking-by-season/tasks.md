## 1. Modèle de données (Prisma)

- [x] 1.1 ~~Ajouter les modèles `Season`, `Episode` et `EpisodeProgress`~~ — superseded : réutilisation du modèle `EpisodeWatch` existant (voir Amendement dans design.md)
- [x] 1.2 ~~Identifiant externe stable~~ — superseded : pas de table `Episode`, titres récupérés à la volée depuis TMDb par numéro d'épisode
- [x] 1.3 ~~Index composite `(profileId, episodeId)`~~ — superseded : l'index unique existant `(mediaId, profileId, season, episode)` couvre déjà l'usage
- [x] 1.4 Générer et appliquer la migration Prisma — non nécessaire, aucun changement de schéma
- [x] 1.5 Valider que le conteneur Docker build correctement après ajout des modèles

## 2. Récupération des métadonnées épisodes

- [x] 2.1 Étendre le pipeline existant de récupération de fiche série pour inclure la liste saisons/épisodes (`getSeasonEpisodes` dans `tmdb.ts`)
- [x] 2.2 ~~Persistance (upsert) des saisons/épisodes~~ — superseded : récupération à la demande sans persistance (décision : éviter la resynchronisation)
- [x] 2.3 Gérer le cas où aucune donnée épisode n'est disponible depuis la source (fallback silencieux + état vide)

## 3. API Backend

- [x] 3.1 Lister les saisons et épisodes d'une série avec statut vu/non-vu pour le profil actif (page média)
- [x] 3.2 Marquer/démarquer un épisode comme vu (`toggleEpisodeWatched`, préexistant)
- [x] 3.3 Mass watch — `markSeasonWatched` (transaction Prisma)
- [x] 3.4 Mass unwatch — `unmarkSeasonWatched` (`deleteMany` atomique)
- [x] 3.5 Isolation par profil validée manuellement (deux profils, même série)
- [x] 3.6 Transactions Prisma garantissent l'absence d'état partiel

## 4. UI - Fiche détail série

- [x] 4.1 Section "Épisodes" groupée par saison (existant, conservé)
- [x] 4.2 Ligne épisode avec case à cocher vu/non-vu + titre TMDb
- [x] 4.3 En-tête de saison avec bouton mass watch/unwatch dynamique
- [x] 4.4 Barre de progression par saison
- [x] 4.5 Pourcentage de progression global de la série
- [x] 4.6 État vide (aucun détail épisode disponible)
- [x] 4.7 Layout responsive (réutilise les classes Tailwind existantes de la page)

## 5. Intégration Watchlist

- [x] 5.1 Progression Watchlist déjà dérivée de l'état des épisodes (`computeProgressPercent`, préexistant)
- [x] 5.2 Cohérence vérifiée manuellement entre Watchlist et fiche détail

## 6. Tests E2E (Playwright)

- [x] 6.1 Marquer un épisode individuel — vérifié manuellement via Playwright MCP
- [x] 6.2 Mass watch d'une saison — vérifié manuellement via Playwright MCP
- [x] 6.3 Mass unwatch d'une saison — vérifié manuellement via Playwright MCP
- [x] 6.4 Isolation entre deux profils — vérifié manuellement via Playwright MCP
- [x] 6.5 État vide — vérifié manuellement via Playwright MCP (donnée en cache sans seasonsJson)

Note : pas de suite Playwright committée (`playwright` n'est pas un devDependency du projet et aucun harness de test n'existe dans le repo). Scénarios exécutés en session via l'outil MCP Playwright contre le serveur dev, non reproductibles en CI en l'état.

## 7. Vérification finale

- [x] 7.1 Revue manuelle du flux complet (ouverture fiche → détail épisodes → mass watch → mass unwatch → retour Watchlist)
- [x] 7.2 Build Docker complet vérifié après toutes les modifications
