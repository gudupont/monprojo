# Déploiement : Container Manager (Synology)

Ce document couvre deux usages :
1. **Développement local avec Docker** (hot-reload, pas besoin de Node installé sur la machine hôte).
2. **Déploiement en production sur un NAS Synology via Container Manager**.

## 1. Développement local avec Docker

Le `Dockerfile` du repo est une image de **production** (multi-stage, build figé). Pour développer avec hot-reload, utilise `docker-compose.dev.yml` : il monte le code source en volume et lance `next dev` dans un conteneur Node standard, sans rebuild à chaque changement de fichier.

```bash
# Première fois : copier le fichier d'env
cp .env.example .env
# Renseigner TMDB_API_KEY / OMDB_API_KEY dans .env
# Générer APP_PASSWORD_HASH : node scripts/hash-password.mjs <mot-de-passe>
# Générer SESSION_SECRET : openssl rand -hex 32

# Lancer le serveur de dev
docker compose -f docker-compose.dev.yml --env-file .env up
```

- App disponible sur http://localhost:3000
- Les `node_modules` et la base SQLite vivent dans des volumes Docker nommés (`monprojo-dev-node-modules`, `monprojo-dev-data`) pour ne pas polluer l'hôte et éviter les conflits d'architecture (binaires Prisma natifs, etc.).
- `npx prisma migrate deploy` tourne au démarrage du conteneur : toute nouvelle migration créée avec `npx prisma migrate dev` (à lancer en local ou via `docker compose -f docker-compose.dev.yml exec monprojo-dev sh`) sera appliquée au prochain restart.
- Pour ouvrir un shell dans le conteneur (ex: `npx prisma studio`, `npx prisma migrate dev`) :
  ```bash
  docker compose -f docker-compose.dev.yml exec monprojo-dev sh
  ```
- Pour repartir d'une base vide : `docker compose -f docker-compose.dev.yml down -v` (supprime aussi les volumes, donc la DB de dev).

Ce flow ne touche pas au `Dockerfile` de prod ni à `docker-compose.yml` — les deux configs sont indépendantes.

## 2. Déploiement production sur Synology (Container Manager)

Trois méthodes. Repo étant **privé**, la méthode **C (GitHub Actions → GHCR)** est recommandée : plus aucun transfert manuel de code, le NAS se contente de tirer une image déjà construite.

### Méthode C — CI/CD via GitHub Actions + GHCR (recommandé, repo privé)

**Principe** : à chaque `git push` sur `main`, GitHub Actions build l'image Docker et la publie sur `ghcr.io/gudupont/monprojo` (registry de packages GitHub, privé car le repo l'est). Le NAS n'a plus qu'à s'authentifier sur ce registry et tirer l'image — pas de code source, pas de build, pas de clé SSH sur le NAS.

Fichiers déjà en place dans le repo :
- `.github/workflows/docker-publish.yml` — build + push vers GHCR sur push `main` (tags `latest` et `sha-xxxxxxx`), avec cache GitHub Actions.
- `docker-compose.yml` — référence `image: ghcr.io/gudupont/monprojo:latest` (le `build: .` reste présent pour pouvoir aussi builder en local si besoin, ex: `docker compose build`).

**Étape 1 — Vérifier que le package GHCR est bien privé** (il l'est par défaut car le repo est privé) : après le premier push sur `main`, aller sur GitHub → onglet **Packages** du repo (ou `github.com/users/gudupont/packages/container/monprojo`) → **Package settings** → confirmer visibilité **Private**.

**Étape 2 — Créer un token GitHub pour que le NAS puisse `docker pull`** :
1. GitHub → **Settings** (compte) → **Developer settings** → **Personal access tokens** → **Tokens (classic)** → **Generate new token**.
2. Scope minimal : `read:packages` uniquement.
3. Copier le token généré (il ne sera plus affiché ensuite) — c'est le "mot de passe" utilisé par le NAS, pas ton mot de passe GitHub.

**Étape 3 — Enregistrer le registry GHCR dans Container Manager** :
1. Container Manager → **Registre** (Registry) → **Paramètres** → **Ajouter**.
2. URL : `https://ghcr.io`
3. Nom d'utilisateur : ton identifiant GitHub (`gudupont`).
4. Mot de passe : le token créé à l'étape 2.

**Étape 4 — Déployer** :
1. Créer un dossier partagé (ex: `/docker/monprojo`) et y déposer **uniquement** `docker-compose.yml` (pas besoin du reste du repo — File Station ou `scp` d'un seul fichier).
2. Container Manager → **Projet** → **Créer**, pointer vers ce dossier. Renseigner `TMDB_API_KEY` / `OMDB_API_KEY` (variables d'environnement du projet ou fichier `.env` à côté du `docker-compose.yml`).
3. Container Manager va **tirer** (`pull`) l'image `ghcr.io/gudupont/monprojo:latest` grâce aux identifiants du registry enregistrés à l'étape 3, plutôt que de la builder — plus besoin des sources.

**Étape 5 — Mettre à jour après un nouveau push** : deux options.
- **Manuel** : Container Manager → Projet `monprojo` → **Action** → **Mettre à jour** (ou dans l'onglet Image, re-télécharger `latest` puis recréer le conteneur).
- **Automatique** : ajouter un conteneur [Watchtower](https://github.com/containrrr/watchtower) à côté (image `containrrr/watchtower`, volume `/var/run/docker.sock:/var/run/docker.sock`) — il surveille les images en cours d'exécution et recrée automatiquement le conteneur `monprojo` dès qu'une nouvelle version `latest` est poussée sur GHCR (poll toutes les X minutes, configurable). Nécessite que Watchtower ait aussi accès aux identifiants GHCR (variable d'env `REPO_USER`/`REPO_PASS` ou fichier `~/.docker/config.json` partagé).

La donnée SQLite reste dans le volume nommé `monprojo-data`, jamais dans l'image — une mise à jour d'image ne touche pas les données.

---

Les deux méthodes suivantes restent utiles en secours (repo public, DSM ancien sans accès registry externe, ou test ponctuel).

### Méthode A — Projet (build direct sur le NAS)

1. **Transférer le repo sur le NAS** via File Station ou `rsync`/`scp`, par exemple dans `/docker/monprojo` (dossier partagé `docker` à créer si absent).
   - Le `.dockerignore` du repo exclut déjà `node_modules`, `.next`, `.git`, `.env`, les `*.db` — pas besoin de nettoyer avant transfert.
2. Ouvrir **Container Manager** → **Projet** → **Créer**.
3. **Nom du projet** : `monprojo`. **Chemin** : sélectionner le dossier transféré à l'étape 1 (celui contenant `docker-compose.yml`).
4. Container Manager détecte `docker-compose.yml` automatiquement. Avant de lancer, éditer la section **Variables d'environnement** du projet (ou créer un fichier `.env` à côté du `docker-compose.yml` sur le NAS) pour renseigner :
   ```
   TMDB_API_KEY=xxxxx
   OMDB_API_KEY=xxxxx
   SESSION_SECRET=xxxxx
   APP_PASSWORD_HASH=xxxxx
   ```
   `SESSION_SECRET` : chaîne aléatoire (ex. `openssl rand -hex 32`). `APP_PASSWORD_HASH` : généré via `node scripts/hash-password.mjs <mot-de-passe>` (voir section Authentification ci-dessous).
5. Lancer le build (**Suivant** → **Compiler** puis **Terminé**). Container Manager exécute l'équivalent de `docker compose build && docker compose up -d`.
6. Le volume nommé `monprojo-data` (déclaré dans `docker-compose.yml`) est créé automatiquement par Container Manager et persiste le fichier SQLite entre redémarrages/mises à jour du conteneur.
7. Vérifier dans l'onglet **Conteneur** que `monprojo` est **En cours d'exécution**, puis tester `http://<IP-du-NAS>:3000`.

**Mettre à jour l'app après un `git pull`** : re-transférer les fichiers modifiés sur le NAS (ou tout le dossier), puis dans Container Manager → Projet `monprojo` → **Actions** → **Compiler** (rebuild) puis **Redémarrer**. La donnée persiste car elle vit dans le volume `monprojo-data`, pas dans l'image.

### Méthode B — Import d'image manuel (DSM plus ancien, ou build fait ailleurs)

À utiliser si Container Manager du NAS ne propose pas la fonctionnalité Projet, ou si tu préfères builder l'image sur ta machine de dev.

1. Sur la machine de dev, builder et exporter l'image :
   ```bash
   docker build -t monprojo:latest .
   docker save monprojo:latest -o monprojo.tar
   ```
2. Transférer `monprojo.tar` sur le NAS (File Station).
3. Container Manager → **Image** → **Ajouter** → **Ajouter depuis un fichier** → sélectionner `monprojo.tar`.
4. Container Manager → **Conteneur** → **Créer**, choisir l'image `monprojo:latest` :
   - **Paramètres réseau** : mapper le port local du NAS (ex: `3000`) vers le port `3000` du conteneur.
   - **Volume** : monter un dossier partagé du NAS (ex: `/docker/monprojo/data`) sur `/app/data` (chemin utilisé par le `Dockerfile` pour le fichier SQLite).
   - **Environnement** : ajouter `TMDB_API_KEY`, `OMDB_API_KEY`, et `DATABASE_URL=file:/app/data/monprojo.db`.
5. Démarrer le conteneur, vérifier les logs (l'entrypoint lance `prisma migrate deploy` puis `next start`).

Pour une mise à jour : rebuild + `docker save` en local, réimporter l'image (elle remplacera l'ancienne version du tag), arrêter/recréer le conteneur en gardant le même montage de volume — la donnée SQLite est préservée.

## 3. Accès HTTPS / nom de domaine (optionnel)

Le NAS Synology propose un reverse proxy intégré (**Panneau de configuration** → **Portail de connexion** → **Avancé** → **Reverse Proxy**) pour exposer `monprojo` sur un sous-domaine avec certificat Let's Encrypt géré par DSM, sans changer la conf de l'app : source `https://monprojo.mondomaine.tld:443` → destination `http://localhost:3000` (ou l'IP interne du NAS si le proxy tourne ailleurs).

## 4. Authentification

L'app est protégée par un mot de passe unique (pas de comptes multiples). Deux variables d'environnement sont requises :

- `SESSION_SECRET` : secret de signature des sessions (JWT HS256). Générer avec `openssl rand -hex 32`.
- `APP_PASSWORD_HASH` : hash du mot de passe d'accès, jamais le mot de passe en clair. Générer avec :
  ```bash
  node scripts/hash-password.mjs "mon-mot-de-passe"
  ```
  Copier la sortie dans `APP_PASSWORD_HASH`. Pour changer le mot de passe : régénérer le hash et redéployer avec la nouvelle valeur.

## 5. Sauvegarde

La seule donnée à sauvegarder est le volume Docker (`monprojo-data` en méthode A, ou le dossier partagé monté en méthode B) : il contient l'unique fichier SQLite de l'application. Inclure ce volume/dossier dans **Hyper Backup** ou une tâche de sauvegarde du dossier partagé côté DSM.
