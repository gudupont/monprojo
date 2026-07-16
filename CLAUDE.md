# Claude Code Configuration

# Guidelines du Projet : MonProjo

## Présentation
MonProjo est un outil de planification et de suivi de visionnage de séries et de films. L'application est développée avec Next.js et conçue pour être déployée via Docker.

## Stack Technique Principale
* **Framework :** Next.js (React)
* **Infrastructure :** Docker
* **Database :** Prisma
* **UI/UX :** Composants fortement inspirés de la maquette cible fournie (utilisation d'états locaux, architecture responsive Desktop/Mobile).

Pour l'architecture détaillée (modèle de données, flux TMDb/OMDb, routes, écart spec/code), voir `ARCHITECTURE.md`. Pour les user stories et leur état d'implémentation, voir `PRD.md`. Les deux sont à tenir à jour à chaque feature significative.

# Règles de Développement & IA
Follow the OpenSpec workflow: /opsx:propose to generate proposal/design/specs/tasks, /opsx:apply to implement all tasks, /opsx:archive to sync delta specs and update the graph. Always sync delta specs into their capability spec when archiving.
Ce projet utilise une approche stricte basée sur deux frameworks pour l'assistance IA :

1. **OpenSpec (Spec-Driven Development)**
   - Ne commence JAMAIS à coder une nouvelle fonctionnalité sans avoir lu ou généré les spécifications OpenSpec correspondantes.
   - Les spécifications se trouvent dans le dossier dédié (ex: `/specs` ou `.openspec`).
   - Utilise les commandes `/opsx:` pour interagir avec les spécifications si nécessaire.

2. **Superpowers (Méthodologie de Code)**
   - Applique le "Systematic Debugging" : analyse toujours les logs et la stack trace avant de proposer une correction.
   - Applique le "Verification-before-completion" : écris les tests ou vérifie manuellement via des scripts que le code fonctionne avant de clôturer une tâche.
   - Écris un code modulaire, typé (TypeScript) et respecte les conventions de Next.js (App Router).

## Outils et "Skills" de l'Assistant
Lors de l'assistance sur ce projet, l'IA doit configurer son comportement autour des outils suivants :

### 1. Développement
* **Skill :** [Superpowers](https://github.com/obra/superpowers)
* **Rôle :** Utiliser ces capacités pour la génération de code robuste sous Next.js, la gestion complexe des états (profils multiples, liste de visionnage, historiques) et la configuration optimale des environnements Docker (Dockerfile, docker-compose).

### 2. Design et UI/UX
* **Skill :** [Impeccable Style](https://impeccable.style/tutorials/getting-started/)
* **Rôle :** Garantir une implémentation CSS/UI fidèle à la maquette cible.
* **Directives Visuelles Clés (extraites de la base de connaissances) :**
  * **Typographie :** `Instrument Serif` (Titres) et `Bricolage Grotesque` (Corps de texte).
  * **Thème Visuel :** Mode sombre par défaut (Fond : `#0A0B0D`, Surfaces : `#15171B` / `#1C1F24`, Bordures : `#262A31`).
  * **Couleurs d'accentuation :** Principalement `#E8A33D` (avec variations de profils : `#E5484D`, `#3FA3A0`, `#3E6FBF`, `#C9668A`, `#7C5CBF`).
  * **Responsive Design :** Layout adaptatif avec barre latérale (Desktop) et navigation inférieure (Mobile).
* For UI card/thumbnail work, match the existing watchlist 2:3 aspect ratio and app design tokens; do not introduce horizontal scrollbars or square thumbnails unless explicitly requested.

### 3. Mémoire et Continuité
* **Skill :** [Graphify](https://graphify.net)
* **Rôle :** Maintenir le contexte architectural du projet sur le long terme. Cartographier les flux de navigation (Accueil, Ma liste, Recherche, Calendrier, Décider) et documenter les décisions techniques au fil des itérations.

## Working Environment section in CLAUDE.md
When editing files, watch for concurrent parallel Claude processes editing the same files, and flag the user if edits appear to revert; avoid running competing processes on the same working tree.

## Tests Automatisés
### Outil : MCP Playwright (obligatoire)
* **Règle stricte :** Tout test manuel ou de vérification (feature terminée, bugfix, régression) DOIT passer par les outils `mcp__plugin_playwright_playwright__*` (navigate, snapshot, click, type, fill_form, evaluate, console_messages, network_requests, take_screenshot...). N'utilise PAS de scripts `curl`, de `fetch` Node ad hoc, ni un autre navigateur/outil pour vérifier le comportement de l'UI.
Always verify UI changes with Playwright against the live app before declaring a task complete; capture snapshots across mobile and desktop viewports.
* **Avant de tester :** lancer le serveur dev (`npm run dev`, port 3000) si non déjà démarré, puis `browser_navigate` vers `http://localhost:3000`.
* **Authentification :** passer par le formulaire réel sur `/login` (voir `src/app/login`, `src/app/api/auth/login`) via `browser_fill_form` / `browser_click` — ne pas injecter de cookie de session à la main sauf si le test l'exige explicitement.
* **Voir aussi :** skill projet `.claude/skills/test-playwright-mcp/SKILL.md` pour le déroulé détaillé (démarrage serveur, login, snapshot avant clic, vérification console/réseau).
* **Cas des specs `e2e/*.spec.ts` (CLI `@playwright/test`) :** ce sont des tests de non-régression versionnés (`npm run test:e2e`), pas le canal d'exploration interactive. Garde-les à jour si tu modifies le comportement qu'ils couvrent, mais pour explorer/déboguer/valider une feature en cours, utilise le MCP Playwright ci-dessus.
* **Cas d'usage critiques à tester :**
  * Bascule de navigation entre les écrans principaux (Home, Detail, Watchlist, Calendar, Decide).
  * Ajout, suppression et mise à jour de la progression d'un film/série dans la Watchlist.
  * Bon fonctionnement de la fonctionnalité "Décide pour moi" (Tirage au sort avec respect des filtres sélectionnés).
  * Bascule entre les différents profils utilisateurs et isolation de leurs données.

## Règles Générales de Qualité
- Privilégier un code Next.js modulaire, propre et bien commenté.
- Valider que le conteneur Docker build correctement après chaque ajout de dépendance majeure.
- Ne pas utiliser de librairies UI externes lourdes si le design cible peut être atteint avec des composants React standards et du CSS atomique/inline optimisé.
- Do what has been asked; nothing more, nothing less
- NEVER create files unless absolutely necessary — prefer editing existing files
- NEVER create documentation files unless explicitly requested
- NEVER save working files or tests to root — use `/src`, `/tests`, `/docs`, `/config`, `/scripts`
- ALWAYS read a file before editing it
- NEVER commit secrets, credentials, or .env files
- NEVER add a `Co-Authored-By` trailer to user commits unless this project's `.claude/settings.json` has `attribution.commit` set (#2078). The Claude Code Bash tool may suggest one in its default commit-message template — ignore it. `Co-Authored-By` is semantic authorship attribution under git/GitHub convention; the tool is the facilitator, not a co-author.
- Keep files under 500 lines
- Validate input at system boundaries

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
