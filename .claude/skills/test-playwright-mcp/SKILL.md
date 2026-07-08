---
name: test-playwright-mcp
description: Verifie une feature/bugfix de MonProjo dans un vrai navigateur via le MCP Playwright (mcp__plugin_playwright_playwright__*). Utilise ce skill au lieu de curl/fetch ad hoc dès qu'il faut tester l'UI (Home, Detail, Watchlist, Calendar, Decide, login, multi-profils).
---

# Test MonProjo via MCP Playwright

Règle projet : toute vérification manuelle passe par les outils `mcp__plugin_playwright_playwright__*`. Jamais de `curl`/`fetch` Node pour "voir si ça marche" côté UI.

## 1. Serveur dev

Vérifie que le serveur tourne sur le port 3000 (`npm run dev`). Si non, démarre-le (en tâche de fond) avant de naviguer.

## 2. Navigation et login

1. `browser_navigate` vers `http://localhost:3000`.
2. Si redirigé vers `/login` : utilise `browser_snapshot` pour voir le formulaire, puis `browser_fill_form` (ou `browser_type` + `browser_click`) avec les identifiants de test. Le login pose les cookies `monprojo_session` (JWT, voir `src/lib/auth`) et `monprojo_profile_id`.
3. Ne fabrique un cookie de session à la main (`browser_evaluate` + `SignJWT`, cf. `e2e/season-watch-cascade.spec.ts`) que si le scénario exige un état précis en base (ex: saison partiellement vue) difficile à atteindre via l'UI seule.

## 3. Boucle de vérification

Pour chaque interaction :
1. `browser_snapshot` avant d'agir, pour cibler le bon élément (rôle + nom accessible).
2. Agis (`browser_click`, `browser_type`, `browser_select_option`, `browser_drag`...).
3. `browser_snapshot` après, pour confirmer l'état attendu (texte, bouton qui change de libellé, modale qui apparaît/disparaît).
4. En cas de doute sur une erreur silencieuse : `browser_console_messages` et `browser_network_requests`.

## 4. Cas d'usage critiques (voir aussi CLAUDE.md)

- Navigation entre Home / Detail / Watchlist / Calendar / Decide.
- Ajout / suppression / mise à jour de progression d'un média dans la Watchlist.
- "Décide pour moi" : vérifier que le tirage respecte les filtres sélectionnés.
- Bascule de profil : vérifier l'isolation des données entre profils (watchlist, progression).
- Cascade de saisons (marquer une saison vue déclenche la modale de confirmation sur les saisons précédentes, cf. `src/lib/actions/watchlist.ts`).

## 5. Rapport avant de clôturer

N'affirme jamais qu'une feature "fonctionne" sans avoir observé le résultat via un `browser_snapshot`/`browser_take_screenshot` réel dans cette session. Si un test CLI (`e2e/*.spec.ts`) couvre le même comportement, propose de le mettre à jour, mais la vérification manuelle elle-même reste MCP Playwright.
