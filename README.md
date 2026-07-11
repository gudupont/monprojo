This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Développement avec Docker (sans Node local)

```bash
cp .env.example .env   # renseigner TMDB_API_KEY / OMDB_API_KEY
docker compose -f docker-compose.dev.yml --env-file .env up
```

Voir [`DEPLOYMENT.md`](./DEPLOYMENT.md) pour le détail (hot-reload, shell dans le conteneur, reset DB).

## Déploiement production

Image Docker de prod : `Dockerfile` (multi-stage) + `docker-compose.yml`. Pour un déploiement sur NAS Synology (Container Manager), voir [`DEPLOYMENT.md`](./DEPLOYMENT.md).

## Synchronisation Plex

La route `POST /api/sync/plex` déclenche la synchronisation Plex (Watchlist + statut vu) de tous les profils configurés. Elle est protégée par la variable d'environnement `PLEX_SYNC_SECRET`, à passer en header `Authorization: Bearer <secret>` ou en paramètre `?token=<secret>`.

Tuto complet (récupération des tokens Plex, config du profil, secret, cron) : voir [`PLEX_SYNC.md`](./docs/PLEX_SYNC.md).

Aucun scheduler n'est lancé dans le conteneur : le déclenchement périodique est délégué à un cron externe, par exemple toutes les 15 minutes :

```cron
*/15 * * * * curl -fsS -X POST "https://monprojo.example.com/api/sync/plex?token=$PLEX_SYNC_SECRET"
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.