# Notifications Slack sur déploiement (Watchtower)

Ce guide explique comment recevoir une notification Slack à chaque déploiement automatique du conteneur `monprojo` par Watchtower (mise à jour d'image détectée et appliquée).

`docker-compose.yml` déclare déjà les variables nécessaires côté service `watchtower` (`WATCHTOWER_NOTIFICATIONS=slack`, `WATCHTOWER_NOTIFICATION_SLACK_HOOK_URL`, `WATCHTOWER_NOTIFICATION_SLACK_CHANNEL`, `WATCHTOWER_NOTIFICATION_SLACK_IDENTIFIER=monprojo-watchtower`, `WATCHTOWER_NOTIFICATIONS_LEVEL=info`) — il ne reste qu'à créer le webhook Slack et renseigner les valeurs côté `.env`.

## 1. Créer le webhook Slack

1. Aller sur [https://api.slack.com/apps](https://api.slack.com/apps) et créer une nouvelle Slack App (ou réutiliser une app existante sur votre workspace).
2. Dans le menu de l'app, activer **Incoming Webhooks**.
3. Cliquer **Add New Webhook to Workspace**.
4. Choisir le canal cible (ex: `#deploiements`) et valider.
5. Copier l'URL du webhook générée (format `https://hooks.slack.com/services/...`).

## 2. Configurer le `.env` du NAS

Dans le `.env` du projet Container Manager (à côté de `docker-compose.yml` sur le NAS), renseigner :

```
WATCHTOWER_NOTIFICATION_SLACK_HOOK_URL="https://hooks.slack.com/services/..."
WATCHTOWER_NOTIFICATION_SLACK_CHANNEL="#deploiements"
```

- `WATCHTOWER_NOTIFICATION_SLACK_HOOK_URL` : l'URL complète copiée à l'étape précédente.
- `WATCHTOWER_NOTIFICATION_SLACK_CHANNEL` : le nom du canal Slack cible (ex: `#deploiements`).

Ces valeurs ne doivent jamais être committées dans le repo — seul `docker-compose.yml` référence `${WATCHTOWER_NOTIFICATION_SLACK_HOOK_URL}` / `${WATCHTOWER_NOTIFICATION_SLACK_CHANNEL}`, sans valeur en dur.

## 3. Redémarrer uniquement le service `watchtower`

Pour appliquer les nouvelles variables sans toucher au conteneur `monprojo` :

- En ligne de commande : `docker compose up -d watchtower`.
- Via Container Manager : onglet **Projet** → `monprojo` → sélectionner le service `watchtower` → **Arrêter** puis **Démarrer**.

## 4. Tester de bout en bout

Forcer un check immédiat pour valider la configuration sans attendre le poll (30 min) :

```bash
docker exec monprojo-watchtower /watchtower --run-once
```

Vérifier que le message apparaît bien sur le canal Slack configuré.

## 5. À quoi s'attendre — exemple de message reçu

Watchtower envoie un message texte brut (pas de mise en forme custom), du type :

```
Watchtower updated 1 container(s)
- monprojo (ghcr.io/gudupont/monprojo:latest): a1b2c3d4e5f6 updated to f6e5d4c3b2a1
```

## 6. Changer de canal

Éditer `WATCHTOWER_NOTIFICATION_SLACK_CHANNEL` dans le `.env`, puis redémarrer `watchtower` (étape 3). Aucun impact sur `monprojo` ni sur les données.

## Points de vigilance

- **Webhook absent ou invalide** : Watchtower log une erreur de notification mais **continue de fonctionner normalement** — le déploiement du conteneur `monprojo` n'est jamais bloqué par un échec de notification Slack.
- **Rotation/révocation du webhook** (départ d'un membre, régénération côté Slack) : casse silencieusement les notifications futures sans casser le déploiement. Pensez à retester (`--run-once`) après toute rotation du webhook.
- **Rollback** : pour désactiver les notifications, vider `WATCHTOWER_NOTIFICATION_SLACK_HOOK_URL` / `WATCHTOWER_NOTIFICATION_SLACK_CHANNEL` dans le `.env` et redémarrer `watchtower` — retour au mode silencieux, sans impact sur le comportement de mise à jour.
