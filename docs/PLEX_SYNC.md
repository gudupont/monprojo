# Tutoriel : configurer la synchronisation Plex

Ce guide explique comment relier un profil MonProjo à Plex pour :
- importer automatiquement la **Watchlist Plex** (compte Plex) dans la watchlist MonProjo,
- marquer automatiquement un film/épisode **vu** dans MonProjo quand il est vu sur un **serveur Plex**.

Deux tokens distincts sont utilisés, car les deux usages sont indépendants (on peut n'activer que l'un des deux) :

| Token | Sert à | Obligatoire pour |
|---|---|---|
| Token de compte Plex | Lire/écrire la Watchlist du compte plex.tv | Sync Watchlist |
| Token du serveur Plex | Lire l'historique de visionnage (`viewCount`) | Sync statut "vu" |

## 1. Récupérer le token de compte Plex

1. Connecte-toi sur [app.plex.tv](https://app.plex.tv) avec le compte Plex à synchroniser.
2. Ouvre les DevTools du navigateur (F12) → onglet **Network**.
3. Recharge la page, puis filtre les requêtes sur `plex.tv`.
4. Clique une requête vers `plex.tv/api/v2/...` et regarde les **headers de requête** : le token est la valeur du header `X-Plex-Token` (ou dans les query params `X-Plex-Token=...`).
5. Copie cette valeur (chaîne alphanumérique d'une vingtaine de caractères).

> Alternative : sur [support.plex.tv](https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/), Plex documente aussi la méthode via "Voir XML" sur un élément de médiathèque.

## 2. Récupérer le token du serveur Plex

- Si le compte qui possède le serveur est le **même** que celui utilisé à l'étape 1, tu peux réutiliser le **même token**.
- Sinon (serveur partagé, compte managé) : connecte-toi sur le serveur Plex concerné via Plex Web, ouvre une médiathèque, clique sur un média → `⋮` → **Obtenir des infos** → **Voir XML**. L'URL affichée contient `?X-Plex-Token=...` : c'est le token serveur.

Note aussi l'**URL du serveur**, au format `http://<ip-ou-host>:32400` (accessible depuis la machine qui héberge MonProjo).

## 3. Renseigner la config dans MonProjo

1. Va sur la page **Profils**.
2. Sur le profil à synchroniser, ouvre le formulaire Plex (`src/components/plex-settings.tsx`).
3. Remplis :
   - **Token de compte Plex** → pour la Watchlist.
   - **URL du serveur Plex** et **Token du serveur Plex** → pour le statut vu (les deux champs vont ensemble, ou aucun).
4. Clique **Enregistrer** : MonProjo teste la connexion (`testPlexAccountConnection` / `testPlexServerConnection` dans `src/lib/plex.ts`) avant de sauvegarder. Une erreur de connexion bloque l'enregistrement.
5. En cas de succès, le formulaire affiche la date de dernière synchro et une éventuelle erreur du dernier run (`lastSyncAt` / `plexSyncError`).

## 4. Configurer le secret de synchronisation

La route `POST /api/sync/plex` (`src/app/api/sync/plex/route.ts`) déclenche la synchro de **tous** les profils configurés. Elle est protégée par un secret partagé, pas par l'auth de session (pensée pour être appelée par un cron externe).

1. Génère un secret :
   ```bash
   openssl rand -hex 32
   ```
2. Renseigne-le dans `.env` (ou les variables d'env du déploiement) :
   ```
   PLEX_SYNC_SECRET="<le secret généré>"
   ```
3. En Docker Compose, la variable est déjà propagée au conteneur (`docker-compose.yml` → `PLEX_SYNC_SECRET: "${PLEX_SYNC_SECRET}"`). Redémarre le conteneur après modif du `.env`.

## 5. Déclencher la synchro périodiquement

Aucun scheduler n'est lancé côté app : c'est un cron externe qui appelle la route. Exemple toutes les 15 minutes :

```cron
*/15 * * * * curl -fsS -X POST "https://monprojo.example.com/api/sync/plex?token=$PLEX_SYNC_SECRET"
```

Ou avec le header `Authorization` plutôt que le query param :

```bash
curl -fsS -X POST -H "Authorization: Bearer $PLEX_SYNC_SECRET" "https://monprojo.example.com/api/sync/plex"
```

La réponse liste le résultat par profil :

```json
{ "results": [{ "profileId": "...", "status": "ok" }] }
```

## 6. Vérifier / débugger

- **Erreur "Connexion au compte Plex impossible"** → token de compte expiré ou mal copié : refais l'étape 1 (les tokens plex.tv expirent si le mot de passe est changé ou l'appareil déconnecté).
- **Erreur "Connexion au serveur Plex impossible"** → vérifie que l'URL est joignable depuis le conteneur MonProjo (pas juste depuis ton poste), et que le port 32400 est ouvert.
- **`plexSyncError` non vide dans l'UI** → dernière tentative de synchro en échec ; le message vient de l'exception levée dans `src/lib/plex-sync.ts`.
- Le rapprochement film/série Plex ↔ TMDb se fait via GUID externes (`tmdb://…`) dans `src/lib/plex-resolve.ts` : si un média Plex n'a pas de match TMDb, il est ignoré silencieusement (pas d'erreur remontée).
