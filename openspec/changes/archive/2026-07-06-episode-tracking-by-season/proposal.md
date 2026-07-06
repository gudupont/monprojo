## Why

Aujourd'hui la Watchlist ne permet de suivre la progression d'une série qu'à un niveau global (ex: "en cours"), sans détail des épisodes vus. L'utilisateur ne peut donc pas savoir précisément où il en est dans une série, épisode par épisode. Il faut exposer le détail complet des épisodes disponibles, groupés par saison, avec validation individuelle, et permettre de valider une saison entière en un clic ("mass watch").

## What Changes

- Ajout du détail des épisodes d'une série dans la fiche détail, groupé par saison (accordéon/section par saison).
- Chaque épisode peut être marqué "vu" / "non vu" individuellement.
- Action "Marquer la saison comme vue" sur l'en-tête de chaque saison : valide en masse tous les épisodes de la saison.
- Calcul et affichage de la progression de complétion (par saison et globale pour la série) à partir de l'état des épisodes.
- Le statut de progression de la série dans la Watchlist se déduit désormais de l'état des épisodes (au lieu d'un statut saisi manuellement).
- Récupération/synchronisation des métadonnées épisodes (numéro, titre, saison) depuis la source de données déjà utilisée pour les fiches séries.

## Capabilities

### New Capabilities
- `episode-tracking`: suivi de l'état vu/non-vu des épisodes d'une série, groupés par saison, avec agrégation de la progression par saison et par série.
- `season-mass-watch`: action de validation groupée de tous les épisodes d'une saison en une seule interaction.

### Modified Capabilities
- (aucune spec existante dans `openspec/specs/` à ce jour — pas de capability existante à modifier)

## Impact

- Modèle de données (Prisma) : nouvelles entités `Season` et `Episode` liées à l'entité série existante de la Watchlist, avec un flag/état de visionnage par épisode (et par profil utilisateur, cf. isolation multi-profils du projet).
- UI : fiche détail série (nouvelle section "Épisodes" groupée par saison), composants de progression (barre/pourcentage par saison et global).
- API/Backend : endpoints pour lister les épisodes d'une série, marquer un épisode vu/non-vu, marquer une saison entière vue.
- Tests E2E (Playwright) : nouveaux scénarios de validation d'épisode et de mass watch par saison, à ajouter à la stratégie de test existante.
