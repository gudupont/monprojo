## Context

Actuellement, la progression de visionnage d'une série dans MonProjo est gérée au niveau global de l'entrée Watchlist (pas de détail par épisode). Le projet utilise Next.js (App Router), Prisma comme couche de données, et supporte plusieurs profils utilisateurs avec isolation des données. La fiche détail d'une série doit maintenant afficher le détail des épisodes groupés par saison, avec possibilité de cocher un épisode ou une saison entière.

## Goals / Non-Goals

**Goals:**
- Modéliser saisons et épisodes en base, liés à la série et au profil utilisateur.
- Afficher les épisodes groupés par saison dans la fiche détail, avec case à cocher par épisode.
- Permettre de valider tous les épisodes d'une saison en un clic (mass watch).
- Calculer la progression (% complétion) par saison et pour la série entière, dérivée de l'état des épisodes.
- Garder l'isolation des données par profil (l'état vu/non-vu est propre à chaque profil).

**Non-Goals:**
- Pas de synchronisation automatique en temps réel avec une source externe de diffusion (dates de sortie déjà gérées ailleurs dans le Calendrier).
- Pas de gestion de notation/avis par épisode (hors périmètre).
- Pas de undo group (annuler un mass watch se fait épisode par épisode ou par re-clic pour tout décocher).

## Decisions

- **Modèle relationnel Season/Episode dédié** plutôt que stocker un simple compteur "dernier épisode vu" sur la série : nécessaire pour permettre de cocher/décocher un épisode individuel dans le désordre (ex: rattrapage partiel) et pour afficher une vraie liste d'épisodes avec titres.
  - Alternative écartée : stocker uniquement `lastWatchedEpisodeNumber` par saison — trop limitant, ne supporte pas les visionnages non linéaires.
- **État de visionnage par (profil, épisode)** via une table de jointure `EpisodeProgress` (profileId, episodeId, watchedAt) plutôt qu'un champ booléen sur `Episode` : un épisode est partagé entre profils, seul son statut vu/non-vu est propre à chaque profil (cohérent avec l'isolation multi-profils déjà en place pour la Watchlist).
- **Mass watch = opération bulk côté serveur** (un seul endpoint qui upsert toutes les `EpisodeProgress` de la saison) plutôt que N appels côté client par épisode : évite la latence perçue et les états intermédiaires incohérents dans l'UI.
- **Progression dérivée, pas stockée** : le % de complétion par saison/série est calculé à la volée (count vus / count total) plutôt que persisté, pour éviter la désynchronisation entre l'état des épisodes et un champ dénormalisé.
- **Métadonnées épisodes récupérées depuis la source déjà utilisée pour les fiches séries** (pas de nouvelle intégration API) : réutilise le pipeline existant, ajoute juste la persistance saisons/épisodes en local.

## Risks / Trade-offs

- [Risque] Séries avec un très grand nombre d'épisodes (ex: séries longues, animes) → beaucoup de lignes `Episode`/`EpisodeProgress` → Mitigation: pagination/lazy-load par saison dans l'UI, index sur `(profileId, episodeId)`.
- [Risque] Mass watch déclenché par erreur sur une saison déjà partiellement vue → perte visuelle de l'état précédent → Mitigation: confirmation légère (ex: bouton distinct "Tout marquer vu" + retour visuel immédiat, décochage possible manuellement).
- [Risque] Désynchronisation si les métadonnées épisodes changent côté source (ex: renumérotation de saison) → Mitigation: réconciliation par identifiant externe stable (id source), pas par numéro de saison/épisode seul.

## Migration Plan

- Ajout de tables Prisma `Season`, `Episode`, `EpisodeProgress` (migration additive, pas de suppression de données existantes).
- Backfill: pas de données historiques d'épisodes à migrer (fonctionnalité nouvelle) ; le statut global existant de la série dans la Watchlist reste affiché tel quel jusqu'à ce que l'utilisateur ouvre le détail épisodes (chargement à la demande).
- Rollback: possibilité de retirer la section épisodes de l'UI sans perte de données (tables additives, non bloquantes pour le reste de l'app).

## Open Questions

- Faut-il conserver un statut global manuel sur la série (ex: "à voir", "en pause") en complément de la progression dérivée des épisodes, ou le déduire entièrement ? À trancher lors de l'implémentation des tasks.
