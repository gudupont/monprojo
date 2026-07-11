# Configuration Plex (guide néophyte)

Ce guide explique comment obtenir les 3 valeurs nécessaires à l'intégration Plex de MonProjo et les saisir dans `/profiles`.

## Pré-requis

- Un compte Plex (gratuit ou Plex Pass).
- Un Plex Media Server installé et démarré (sur un NAS, un PC, ou un serveur dédié) — c'est lui qui héberge votre bibliothèque de films/séries.
- Le serveur doit être accessible depuis la machine qui exécute MonProjo (réseau local suffit ; un accès distant nécessite que le serveur Plex soit joignable depuis l'extérieur, cf. section Dépannage).

## 1. Obtenir le token de compte Plex (`plexAccountToken`)

Ce token permet à MonProjo de lire votre Watchlist Plex (compte).

1. Connectez-vous à [app.plex.tv](https://app.plex.tv) dans votre navigateur.
2. Ouvrez n'importe quel média de votre bibliothèque, cliquez sur les `⋯` (menu contextuel) puis **"Obtenir des informations"** / **"Get Info"**.
3. Dans la fenêtre qui s'ouvre, cliquez sur **"Afficher le token XML"** ("View XML") en bas — l'URL affichée contient un paramètre `X-Plex-Token=...`.
4. Copiez uniquement la valeur après `X-Plex-Token=` : c'est votre `plexAccountToken`.

Alternative officielle : voir l'article support Plex "Finding an authentication token / X-Plex-Token" (méthode inspection réseau via les outils développeur du navigateur, recherche de l'en-tête `X-Plex-Token` dans une requête vers `plex.tv`).

## 2. Obtenir l'URL et le token du serveur Plex

### URL du serveur (`plexServerUrl`)

- **Sur le réseau local** : `http://<ip-locale-du-serveur>:32400` (ex. `http://192.168.1.50:32400`). L'IP se trouve dans les réglages réseau du NAS/serveur, ou dans Plex Web → **Réglages → Distant** (section "Accès personnalisé").
- **À distance** : si vous avez activé l'accès distant Plex, l'URL distante est visible dans Plex Web → **Réglages → Distant** (ex. `https://<id>.plex.direct:32400`).

### Token du serveur (`plexServerToken`)

- Dans la majorité des cas, il s'agit du **même token** que `plexAccountToken` obtenu à l'étape 1 (le compte propriétaire du serveur).
- Si vous souhaitez un token dédié à l'appareil/serveur : Plex Web → cliquez sur votre serveur dans la barre latérale → `⋯` → **"Obtenir un token d'appareil"** ("Get device token"), ou reprenez la méthode "Afficher le token XML" depuis une page du serveur concerné.

## 3. Saisir les valeurs dans MonProjo

1. Allez sur `/profiles` dans MonProjo, sélectionnez votre profil.
2. Dans le bloc **Plex** (`PlexSettings`), renseignez :
   - **Token de compte Plex (Watchlist)** : la valeur de l'étape 1.
   - **URL du serveur Plex** : la valeur de l'étape 2 (URL).
   - **Token du serveur Plex** : la valeur de l'étape 2 (token).
3. Cliquez sur **Enregistrer**. MonProjo teste la connexion avant de sauvegarder :
   - **"Connexion Plex réussie, config sauvegardée."** → tout est bon.
   - Message d'erreur → voir Dépannage ci-dessous, rien n'est sauvegardé tant que la connexion échoue.

Note : le token de compte et le token/URL serveur sont indépendants — vous pouvez renseigner l'un sans l'autre (ex. seulement la Watchlist compte, sans serveur local).

## 4. Dépannage

| Message | Cause probable | Solution |
|---|---|---|
| "Connexion au compte Plex impossible : vérifiez le token." | `plexAccountToken` invalide/expiré (`testPlexAccountConnection` échoue) | Régénérez le token (étape 1) — les tokens Plex peuvent expirer après changement de mot de passe. |
| "Connexion au serveur Plex impossible : vérifiez l'URL et le token." | `plexServerUrl`/`plexServerToken` incorrects, ou serveur injoignable (`testPlexServerConnection` échoue) | Vérifiez que le Plex Media Server est démarré et que l'URL est correcte (ping/`curl` depuis la machine MonProjo). |
| "L'URL et le token du serveur Plex doivent être renseignés ensemble." | Un seul des deux champs serveur rempli | Renseignez l'URL **et** le token du serveur ensemble, ou laissez les deux vides. |
| Le serveur Plex ne répond pas depuis un déploiement distant (ex. NAS externe, cloud) | Le serveur Plex n'est accessible que sur le réseau local, pas d'accès distant activé | Activez l'accès distant dans Plex Web (**Réglages → Distant**) ou déployez MonProjo sur le même réseau que le serveur Plex. |
| Le badge de disponibilité affiche toujours "Absent de Plex" | Serveur Plex Media Server d'une version qui ne supporte pas le filtre `guid=tmdb://...`, ou média absent de la bibliothèque | Le système traite silencieusement toute erreur de vérification comme "absent" (pas d'erreur bloquante) — vérifiez manuellement si le titre est bien présent dans votre bibliothèque Plex. |

## 5. "Disponible sur Plex" vs "Watchlist/statut vu Plex"

Deux notions distinctes, à ne pas confondre :

- **Badge "Disponible sur Plex" (fiche détail)** : indique si le film/série est déjà présent dans la bibliothèque de votre serveur Plex, indépendamment du fait que vous l'ayez vu ou non. C'est une vérification ponctuelle, faite à l'affichage de la fiche détail.
- **Watchlist / statut vu Plex (sync existant)** : import périodique de votre Watchlist Plex (compte) vers MonProjo, et détection du statut "vu" à partir de votre historique de visionnage sur le serveur. C'est un flux de synchronisation en tâche de fond, distinct du badge de disponibilité.

En résumé : le badge répond à "puis-je regarder ça tout de suite sur mon Plex ?", la synchro répond à "qu'ai-je déjà mis dans ma Watchlist / déjà regardé sur Plex ?".
