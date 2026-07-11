#!/bin/sh
set -e

npx prisma migrate deploy

node -e "
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
db.importBatch.findFirst({ where: { status: 'RUNNING', completedAt: null } })
  .then((batch) => {
    if (batch) {
      console.warn('[import] Import TVtime interrompu détecté (batch ' + batch.id + '), en attente de décision utilisateur.');
    }
  })
  .catch((err) => console.error('[import] Vérification des imports orphelins impossible:', err))
  .finally(() => db.\$disconnect());
"

exec npx next start -p "${PORT:-3000}"
