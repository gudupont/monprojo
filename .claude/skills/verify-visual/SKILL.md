---
name: verify-visual
description: Recapture toutes les surfaces de régression visuelle (Watchlist, Détail, Calendrier, Profil, Recherche), compare aux baselines tests/visual/__screenshots__, et échoue bruyamment (>1% delta) avec les images côte-à-côte.
---

# /verify-visual

1. Lance : `npm run test:visual`
   - Sous le capot : `playwright test --config=playwright.visual.config.ts`.
   - Le harnais démarre son propre serveur Next.js dédié (port 3100) et un mock TMDb local — aucune interférence avec un `npm run dev` déjà lancé sur le port 3000, aucune dépendance réseau externe.
2. Si tout passe : rapporte "Régression visuelle : 0 delta, N surfaces vérifiées." (N = nombre de tests exécutés, visible dans la sortie Playwright).
3. Si une capture dépasse 1% de delta :
   - Playwright génère `<nom>-expected.png`, `<nom>-actual.png`, `<nom>-diff.png` sous `test-results/`.
   - Liste, pour chaque surface en échec : les 3 chemins d'image + le % exact de pixels différents (donné dans la sortie Playwright).
   - Termine en échec explicite — ne jamais masquer un delta ni l'accepter silencieusement.
   - Indique la commande de consultation : `npx playwright show-report` (rapport HTML, vue côte-à-côte intégrée).
4. Mise à jour intentionnelle des baselines (uniquement si le changement visuel est voulu, jamais automatique) :
   `npm run test:visual:update`

**Limite connue** : `maxDiffPixelRatio: 0.01` est calculé sur la page entière. Une régression de couleur cantonnée à un petit élément (ex. un swap de couleur d'accent sur un badge ou bouton fin) peut ne pas dépasser fiablement ce seuil. C'est un compromis assumé qui privilégie la détection des régressions de layout/rendu plutôt qu'une correspondance pixel-parfaite des couleurs.
